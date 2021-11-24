const _ = require('lodash/fp')

const db = require('../db')
const T = require('../time')
const BN = require('../bn')

// FP operations on Postgres result in very big errors.
// E.g.: 1853.013808 * 1000 = 1866149.494
const REDEEMABLE_AGE = T.day / 1000

const CASH_OUT_TRANSACTION_STATES = `
case
  when error = 'Operator cancel' then 'Cancelled'
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

  const billsObj = {
    provisioned1: bills[0]?.provisioned ?? 0,
    provisioned2: bills[1]?.provisioned ?? 0,
    provisioned3: bills[2]?.provisioned ?? 0,
    provisioned4: bills[3]?.provisioned ?? 0,
    denomination1: bills[0]?.denomination ?? 0,
    denomination2: bills[1]?.denomination ?? 0,
    denomination3: bills[2]?.denomination ?? 0,
    denomination4: bills[3]?.denomination ?? 0
  }

  return _.assign(tx, billsObj)
}

function toDb (tx) {
  const massager = _.flow(convertBigNumFields, addDbBills,
    _.omit(['direction', 'bills', 'promoCodeApplied']), _.mapKeys(convertField))

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

  const billFields = ['denomination1', 'denomination2', 'denomination3', 'denomination4', 'provisioned1', 'provisioned2', 'provisioned3', 'provisioned4']

  if (_.every(_.isNil, _.at(billFields, newObj))) return newObj
  if (_.some(_.isNil, _.at(billFields, newObj))) throw new Error('Missing cassette values')

  const billFieldsArr = [
    {
      denomination: newObj.denomination1,
      provisioned: newObj.provisioned1
    },
    {
      denomination: newObj.denomination2,
      provisioned: newObj.provisioned2
    },
    {
      denomination: newObj.denomination3,
      provisioned: newObj.provisioned3
    },
    {
      denomination: newObj.denomination4,
      provisioned: newObj.provisioned4
    }
  ]

  // There can't be bills with denomination === 0.
  // If a bill has denomination === 0, then that cassette is not set and should be filtered out.
  const bills = _.filter(it => it.denomination > 0, billFieldsArr)

  return _.set('bills', bills, _.omit(billFields, newObj))
}

function redeemableTxs (deviceId) {
  const sql = `select * from cash_out_txs
  where device_id=$1
  and redeem=$2
  and dispense=$3
  and provisioned_1 is not null
  and extract(epoch from (now() - greatest(created, confirmed_at))) < $4`

  return db.any(sql, [deviceId, true, false, REDEEMABLE_AGE])
    .then(_.map(toObj))
}
