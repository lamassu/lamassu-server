const _ = require('lodash/fp')

const db = require('../db')
const T = require('../time')
const BN = require('../bn')

const REDEEMABLE_AGE = T.day

const CASH_OUT_TRANSACTION_STATES = `
case 
  when error is not null then 'Error'
  when dispense then 'Success'
  when (extract(epoch from (now() - greatest(created, confirmed_at))) * 1000) >= ${REDEEMABLE_AGE} then 'Expired'
  else 'Pending'
end`

module.exports = { redeemableTxs, toObj, toDb, REDEEMABLE_AGE, CASH_OUT_TRANSACTION_STATES }

const mapValuesWithKey = _.mapValues.convert({cap: false})

function convertBigNumFields (obj) {
  const convert = (value, key) => {
    if (_.includes(key, [ 'cryptoAtoms', 'receivedCryptoAtoms', 'fiat' ])) {
      return value.toString()
    }

    // Only test isNil for these fields since the others should not be empty.
    if (_.includes(key, [ 'commissionPercentage', 'rawTickerPrice' ]) && !_.isNil(value)) {
      return value.toString()
    }

    return value
  }

  const convertKey = key => _.includes(key, ['cryptoAtoms', 'fiat'])
    ? key + '#'
    : key

  return _.mapKeys(convertKey, mapValuesWithKey(convert, obj))
}

function convertField (key) {
  return _.snakeCase(key)
}

function addDbBills (tx) {
  const bills = tx.bills
  if (_.isEmpty(bills)) return tx

  return _.assign(tx, {
    provisioned1: bills[0].provisioned,
    provisioned2: bills[1].provisioned,
    denomination1: bills[0].denomination,
    denomination2: bills[1].denomination
  })
}

function toDb (tx) {
  const massager = _.flow(convertBigNumFields, addDbBills,
    _.omit(['direction', 'bills']), _.mapKeys(convertField))

  return massager(tx)
}

function toObj (row) {
  if (!row) return null

  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (key === 'received_crypto_atoms' && row[key]) {
      newObj[objKey] = new BN(row[key])
      return
    }
    if (_.includes(key, ['crypto_atoms', 'fiat', 'commission_percentage', 'raw_ticker_price'])) {
      newObj[objKey] = new BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  newObj.direction = 'cashOut'

  const billFields = ['denomination1', 'denomination2', 'provisioned1', 'provisioned2']

  if (_.every(_.isNil, _.at(billFields, newObj))) return newObj
  if (_.some(_.isNil, _.at(billFields, newObj))) throw new Error('Missing cassette values')

  const bills = [
    {
      denomination: newObj.denomination1,
      provisioned: newObj.provisioned1
    },
    {
      denomination: newObj.denomination2,
      provisioned: newObj.provisioned2
    }
  ]

  return _.set('bills', bills, _.omit(billFields, newObj))
}

function redeemableTxs (deviceId) {
  const sql = `select * from cash_out_txs
  where device_id=$1
  and redeem=$2
  and dispense=$3
  and provisioned_1 is not null
  and (extract(epoch from (now() - greatest(created, confirmed_at))) * 1000) < $4`

  return db.any(sql, [deviceId, true, false, REDEEMABLE_AGE])
    .then(_.map(toObj))
}
