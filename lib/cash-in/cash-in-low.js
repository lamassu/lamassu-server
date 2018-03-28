const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const BN = require('../bn')
const T = require('../time')
const logger = require('../logger')
const E = require('../error')

const PENDING_INTERVAL_MS = 60 * T.minutes

const massage = _.flow(_.omit(['direction', 'cryptoNetwork', 'bills']),
  convertBigNumFields, _.mapKeys(_.snakeCase))

module.exports = {toObj, upsert, insert, update, massage, isClearToSend}

function convertBigNumFields (obj) {
  const convert = value => value && value.isBigNumber
    ? value.toString()
    : value

  return _.mapValues(convert, obj)
}

function toObj (row) {
  if (!row) return null

  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (_.includes(key, ['crypto_atoms', 'fiat', 'cash_in_fee', 'cash_in_fee_crypto'])) {
      newObj[objKey] = BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  newObj.direction = 'cashIn'

  return newObj
}

function upsert (t, dbTx, preProcessedTx) {
  if (!dbTx) {
    return insert(t, preProcessedTx)
      .then(tx => ({dbTx, tx}))
  }

  return update(t, dbTx, diff(dbTx, preProcessedTx))
    .then(tx => ({dbTx, tx}))
}

function insert (t, tx) {
  const dbTx = massage(tx)
  const sql = pgp.helpers.insert(dbTx, null, 'cash_in_txs') + ' returning *'
  return t.one(sql)
    .then(toObj)
}

function update (t, tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = massage(changes)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_in_txs') +
    pgp.as.format(' where id=$1', [tx.id]) + ' returning *'

  return t.one(sql)
    .then(toObj)
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  if (!oldTx) throw new Error('oldTx must not be null')
  if (!newTx) throw new Error('newTx must not be null')

  _.forEach(fieldKey => {
    const oldField = oldTx[fieldKey]
    const newField = newTx[fieldKey]
    if (fieldKey === 'bills') return
    if (_.isEqualWith(nilEqual, oldField, newField)) return

    if (!ensureRatchet(oldField, newField, fieldKey)) {
      logger.warn('Value from lamassu-machine would violate ratchet [%s]', fieldKey)
      logger.warn('Old tx: %j', oldTx)
      logger.warn('New tx: %j', newTx)
      throw new E.RatchetError('Value from lamassu-machine would violate ratchet')
    }

    updatedTx[fieldKey] = newField
  }, _.keys(newTx))

  return updatedTx
}

function ensureRatchet (oldField, newField, fieldKey) {
  const monotonic = ['cryptoAtoms', 'fiat', 'cashInFeeCrypto', 'send', 'sendConfirmed', 'operatorCompleted', 'timedout', 'txVersion']
  const free = ['sendPending', 'error', 'errorCode', 'customerId']

  if (_.isNil(oldField)) return true
  if (_.includes(fieldKey, monotonic)) return isMonotonic(oldField, newField, fieldKey)

  if (_.includes(fieldKey, free)) {
    if (_.isNil(newField)) return false
    return true
  }

  if (_.isNil(newField)) return false
  if (oldField.isBigNumber && newField.isBigNumber) return BN(oldField).eq(newField)
  if (oldField.toString() === newField.toString()) return true

  return false
}

function isMonotonic (oldField, newField, fieldKey) {
  if (_.isNil(newField)) return false
  if (_.isBoolean(oldField)) return oldField === newField || !oldField
  if (oldField.isBigNumber) return oldField.lte(newField)
  if (_.isNumber(oldField)) return oldField <= newField

  throw new Error(`Unexpected value [${fieldKey}]: ${oldField}, ${newField}`)
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
}

function isClearToSend (oldTx, newTx) {
  const now = Date.now()

  return newTx.send &&
    (!oldTx || (!oldTx.sendPending && !oldTx.sendConfirmed)) &&
    (newTx.created > now - PENDING_INTERVAL_MS)
}
