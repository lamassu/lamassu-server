const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('../db')
const machineLoader = require('../machine-loader')
const tx = require('../tx')
const cashInTx = require('../cash-in/cash-in-tx')
const { REDEEMABLE_AGE } = require('../cash-out/cash-out-helper')
const coinUtils = require('../coin-utils')
const BN = require('../bn')

const NUM_RESULTS = 1000

function addNames (txs) {
  return machineLoader.getMachineNames()
    .then(machines => {
      const addName = tx => {
        const machine = _.find(['deviceId', tx.deviceId], machines)
        const name = machine ? machine.name : 'Unpaired'
        return _.set('machineName', name, tx)
      }

      return _.map(addName, txs)
    })
}

const camelize = _.mapKeys(_.camelCase)

function batch (from = new Date(0).toISOString(), until = new Date().toISOString(), limit = null, offset = 0, id = null, simplified = false) {
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']), _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class, txs.*,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  ((not txs.send_confirmed) and (txs.created <= now() - interval $1)) as expired
  from cash_in_txs as txs
  left outer join customers c on txs.customer_id = c.id
  where txs.created >= $2 and txs.created <= $3 ${
    id !== null ? `and txs.device_id = $6` : ``
  }
  order by created desc limit $4 offset $5`

  const cashOutSql = `select 'cashOut' as tx_class,
  txs.*,
  actions.tx_hash,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  (NOT txs.dispense AND extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) >= $1) as expired
  from cash_out_txs txs
  inner join cash_out_actions actions on txs.id = actions.tx_id
  and actions.action = 'provisionAddress'
  left outer join customers c on txs.customer_id = c.id
  where txs.created >= $2 and txs.created <= $3 ${
    id !== null ? `and txs.device_id = $6` : ``
  }
  order by created desc limit $4 offset $5`

  return Promise.all([
    db.any(cashInSql, [
      cashInTx.PENDING_INTERVAL,
      from,
      until,
      limit,
      offset,
      id
    ]),
    db.any(cashOutSql, [REDEEMABLE_AGE, from, until, limit, offset, id])
  ]).then(packager)
    .then(res => {
      if (simplified) return simplifiedBatch(res)
      else return res
    })
}

function simplifiedBatch (data) {
  const fields = ['txClass', 'id', 'created', 'machineName',
    'cryptoCode', 'fiat', 'fiatCode', 'phone', 'toAddress',
    'txHash', 'dispense', 'error', 'status', 'fiatProfit', 'cryptoAmount']

  const addSimplifiedFields = _.map(it => ({
    ...it,
    status: getStatus(it),
    fiatProfit: getProfit(it).toString(),
    cryptoAmount: getCryptoAmount(it)
  }))

  return _.compose(_.map(_.pick(fields)), addSimplifiedFields)(data)
}

const getCryptoAmount = it => coinUtils.toUnit(BN(it.cryptoAtoms), it.cryptoCode).toString()

const getProfit = it => {
  const getCommissionFee = it => BN(it.commissionPercentage).mul(BN(it.fiat))
  if (!it.cashInFee) return getCommissionFee(it)
  return getCommissionFee(it).add(BN(it.cashInFee))
}

const getCashOutStatus = it => {
  if (it.hasError) return 'Error'
  if (it.dispense) return 'Success'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashInStatus = it => {
  if (it.operatorCompleted) return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.sendConfirmed) return 'Sent'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getStatus = it => {
  if (it.txClass === 'cashOut') {
    return getCashOutStatus(it)
  }
  return getCashInStatus(it)
}

function getCustomerTransactionsBatch (ids) {
  const packager = _.flow(it => {
    return it
  }, _.flatten, _.orderBy(_.property('created'), ['desc']), _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class, txs.*,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  ((not txs.send_confirmed) and (txs.created <= now() - interval $2)) as expired
  from cash_in_txs as txs
  left outer join customers c on txs.customer_id = c.id
  where c.id IN ($1^)
  order by created desc limit $3`

  const cashOutSql = `select 'cashOut' as tx_class,
  txs.*,
  actions.tx_hash,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  (NOT txs.dispense AND extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) >= $3) as expired
  from cash_out_txs txs
  inner join cash_out_actions actions on txs.id = actions.tx_id
  and actions.action = 'provisionAddress'
  left outer join customers c on txs.customer_id = c.id
  where c.id IN ($1^)
  order by created desc limit $2`
  return Promise.all([
    db.any(cashInSql, [_.map(pgp.as.text, ids).join(','), cashInTx.PENDING_INTERVAL, NUM_RESULTS]),
    db.any(cashOutSql, [_.map(pgp.as.text, ids).join(','), NUM_RESULTS, REDEEMABLE_AGE])
  ])
  .then(packager).then(transactions => {
    const transactionMap = _.groupBy('customerId', transactions)
    return ids.map(id => transactionMap[id]) 
  })
}

function single (txId) {
  const packager = _.flow(_.compact, _.map(camelize), addNames)

  const cashInSql = `select 'cashIn' as tx_class, txs.*,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  ((not txs.send_confirmed) and (txs.created <= now() - interval $1)) as expired
  from cash_in_txs as txs
  left outer join customers c on txs.customer_id = c.id
  where id=$2`

  const cashOutSql = `select 'cashOut' as tx_class,
  txs.*,
  actions.tx_hash,
  c.phone as customer_phone,
  c.id_card_data_number as customer_id_card_data_number,
  c.id_card_data_expiration as customer_id_card_data_expiration,
  c.id_card_data as customer_id_card_data,
  c.name as customer_name,
  c.front_camera_path as customer_front_camera_path,
  c.id_card_photo_path as customer_id_card_photo_path,
  (NOT txs.dispense AND extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) >= $2) as expired
  from cash_out_txs txs
  inner join cash_out_actions actions on txs.id = actions.tx_id
  and actions.action = 'provisionAddress'
  left outer join customers c on txs.customer_id = c.id
  where id=$1`

  return Promise.all([
    db.oneOrNone(cashInSql, [cashInTx.PENDING_INTERVAL, txId]),
    db.oneOrNone(cashOutSql, [txId, REDEEMABLE_AGE])
  ])
    .then(packager)
    .then(_.head)
}

function cancel (txId) {
  return tx.cancel(txId)
    .then(() => single(txId))
}

module.exports = { simplifiedBatch, batch, single, cancel, getCustomerTransactionsBatch }