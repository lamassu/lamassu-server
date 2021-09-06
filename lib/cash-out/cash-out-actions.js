const _ = require('lodash/fp')
const pgp = require('pg-promise')()

module.exports = {logDispense, logActionById, logAction, logError}

function logDispense (t, tx) {
  const baseRec = {error: tx.error, error_code: tx.errorCode}
  const rec = _.merge(mapDispense(tx), baseRec)
  const action = _.isEmpty(tx.error) ? 'dispense' : 'dispenseError'
  return logAction(t, action, rec, tx)
}

function logActionById (t, action, _rec, txId) {
  const rec = _.assign(_rec, {action, tx_id: txId, redeem: false})
  const sql = pgp.helpers.insert(rec, null, 'cash_out_actions')

  return t.none(sql)
}

function logAction (t, action, _rec, tx) {
  const rec = _.assign(_rec, {action, tx_id: tx.id, redeem: !!tx.redeem, device_id: tx.deviceId})
  const sql = pgp.helpers.insert(rec, null, 'cash_out_actions')

  return t.none(sql)
    .then(_.constant(tx))
}

function logError (t, action, err, tx) {
  return logAction(t, action, {
    error: err.message,
    error_code: err.name
  }, tx)
}

function mapDispense (tx) {
  const bills = tx.bills

  if (_.isEmpty(bills)) return {}

  const res = {}

  _.forEach(it => {
    res[`provisioned_${it + 1}`] = bills[it].provisioned
    res[`denomination_${it + 1}`] = bills[it].denomination
    res[`dispensed_${it + 1}`] = bills[it].dispensed
    res[`rejected_${it + 1}`] = bills[it].rejected
  }, _.times(_.identity(), _.size(bills)))

  return res
}
