const _ = require('lodash/fp')

const db = require('../db')
const machineLoader = require('../machine-loader')
const tx = require('../tx')
const cashInTx = require('../cash-in/cash-in-tx')
const { REDEEMABLE_AGE } = require('../cash-out/cash-out-helper')

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

function batch () {
  const packager = _.flow(_.flatten, _.orderBy(_.property('created'), ['desc']),
    _.take(NUM_RESULTS), _.map(camelize), addNames)

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
  order by created desc limit $2`

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
  (extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $2 as expired
  from cash_out_txs txs
  inner join cash_out_actions actions on txs.id = actions.tx_id
  and actions.action = 'provisionAddress'
  left outer join customers c on txs.customer_id = c.id
  order by created desc limit $1`

  return Promise.all([db.any(cashInSql, [cashInTx.PENDING_INTERVAL, NUM_RESULTS]), db.any(cashOutSql, [NUM_RESULTS, REDEEMABLE_AGE])])
    .then(packager)
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
  (extract(epoch from (now() - greatest(txs.created, txs.confirmed_at))) * 1000) >= $2 as expired
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

module.exports = { batch, single, cancel }
