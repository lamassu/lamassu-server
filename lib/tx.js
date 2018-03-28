const _ = require('lodash/fp')
const BN = require('./bn')
const CashInTx = require('./cash-in/cash-in-tx')
const CashOutTx = require('./cash-out/cash-out-tx')

function process (tx, pi) {
  const mtx = massage(tx)
  if (mtx.direction === 'cashIn') return CashInTx.post(mtx, pi)
  if (mtx.direction === 'cashOut') return CashOutTx.post(mtx, pi)

  return Promise.reject(new Error('No such tx direction: ' + mtx.direction))
}

function post (tx, pi) {
  return process(tx, pi)
    .then(_.set('dirty', false))
}

function massage (tx) {
  const isDateField = r => r === 'created' || _.endsWith('_time', r)
  const transformDate = (v, k) => isDateField(k) ? new Date(v) : v
  const mapValuesWithKey = _.mapValues.convert({'cap': false})
  const transformDates = r => mapValuesWithKey(transformDate, r)

  const mapBN = r => {
    const update = r.direction === 'cashIn'
      ? {
        cryptoAtoms: BN(r.cryptoAtoms),
        fiat: BN(r.fiat),
        cashInFee: BN(r.cashInFee),
        cashInFeeCrypto: BN(r.cashInFeeCrypto),
        minimumTx: BN(r.minimumTx)
      }
      : {
        cryptoAtoms: BN(r.cryptoAtoms),
        fiat: BN(r.fiat)
      }

    return _.assign(r, update)
  }

  const mapper = _.flow(transformDates, mapBN, _.unset('dirty'))

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

module.exports = {post, cancel}
