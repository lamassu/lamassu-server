const _ = require('lodash/fp')
const db = require('./db')
const BN = require('./bn')
const CashInTx = require('./cash-in/cash-in-tx')
const CashOutTx = require('./cash-out/cash-out-tx')
const T = require('./time')

// FP operations on Postgres result in very big errors.
// E.g.: 1853.013808 * 1000 = 1866149.494
const REDEEMABLE_AGE = T.day / 1000

function process (tx, pi) {
  const mtx = massage(tx, pi)
  if (mtx.direction === 'cashIn') return CashInTx.post(mtx, pi)
  if (mtx.direction === 'cashOut') return CashOutTx.post(mtx, pi)
  return Promise.reject(new Error('No such tx direction: ' + mtx.direction))
}

function post (tx, pi) {
  return process(tx, pi)
    .then(_.set('dirty', false))
}

function massage (tx, pi) {
  const isDateField = r => r === 'created' || _.endsWith('_time', r)
  const transformDate = (v, k) => isDateField(k) ? new Date(v) : v
  const mapValuesWithKey = _.mapValues.convert({'cap': false})
  const transformDates = r => mapValuesWithKey(transformDate, r)

  const mapBN = r => {
    const update = r.direction === 'cashIn'
      ? {
        cryptoAtoms: new BN(r.cryptoAtoms),
        fiat: new BN(r.fiat),
        cashInFee: new BN(r.cashInFee),
        cashInFeeCrypto: new BN(r.cashInFeeCrypto),
        commissionPercentage: new BN(r.commissionPercentage),
        rawTickerPrice: r.rawTickerPrice ? new BN(r.rawTickerPrice) : null,
        minimumTx: new BN(r.minimumTx)
      }
      : {
        cryptoAtoms: new BN(r.cryptoAtoms),
        fiat: new BN(r.fiat),
        rawTickerPrice: r.rawTickerPrice ? new BN(r.rawTickerPrice) : null,
        commissionPercentage: new BN(r.commissionPercentage)
      }

    return _.assign(r, update)
  }

  const mapper = _.flow(
    transformDates,
    mapBN,
    _.unset('dirty'))

  return mapper(tx)
}

function cancel (txId) {
  const promises = [
    CashInTx.cancel(txId).then(() => true).catch(() => false),
    CashOutTx.cancel(txId).then(() => true).catch(() => false)
  ]

  return Promise.all(promises)
    .then(r => {
      if (_.some(r)) return
      throw new Error('No such transaction')
    })
}

function customerHistory (customerId, thresholdDays) {
  const sql = `SELECT * FROM (
    SELECT txIn.id, txIn.created, txIn.fiat, 'cashIn' AS direction,
      ((NOT txIn.send_confirmed) AND (txIn.created <= now() - interval $3)) AS expired
      FROM cash_in_txs txIn
      WHERE txIn.customer_id = $1
      AND txIn.created > now() - interval $2
      AND fiat > 0
    UNION
    SELECT txOut.id, txOut.created, txOut.fiat, 'cashOut' AS direction,
      (NOT txOut.dispense AND extract(epoch FROM (now() - greatest(txOut.created, txOut.confirmed_at))) >= $4) AS expired
      FROM cash_out_txs txOut
      WHERE txOut.customer_id = $1
      AND txOut.created > now() - interval $2
      AND error_code NOT IN ('operatorCancel', 'scoreThresholdReached', 'ciphertraceError')
      AND fiat > 0
  ) ch WHERE NOT ch.expired ORDER BY ch.created`

  const days = _.isNil(thresholdDays) ? 0 : thresholdDays
  return db.any(sql, [customerId, `${days} days`, '60 minutes', REDEEMABLE_AGE])
}

module.exports = { post, cancel, customerHistory }
