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

const MAX_CASSETTES = 4
const MAX_STACKERS = 3

const BILL_FIELDS = [
  'denomination1',
  'denomination2',
  'denomination3',
  'denomination4',
  'denomination1f',
  'denomination1r',
  'denomination2f',
  'denomination2r',
  'denomination3f',
  'denomination3r',
  'provisioned1',
  'provisioned2',
  'provisioned3',
  'provisioned4',
  'provisioned1f',
  'provisioned1r',
  'provisioned2f',
  'provisioned2r',
  'provisioned3f',
  'provisioned3r'
]

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
  return _.includes('denomination', key) || _.includes('provisioned', key) ? key : _.snakeCase(key)
}

function addDbBills (tx) {
  const bills = tx.bills
  if (_.isEmpty(bills)) return tx

  const billFields = _.map(it => _.replace(/(denomination|provisioned)/g, '$1_')(it), BILL_FIELDS)

  const billsObj = _.flow(
    _.reduce(
      (acc, value) => {
        const suffix = value.name.replace(/cassette|stacker/gi, '')
        return {
          ...acc,
          [`provisioned_${suffix}`]: value.provisioned,
          [`denomination_${suffix}`]: value.denomination
        }
      },
      {}
    ),
    it => {
      const missingKeys = _.reduce(
        (acc, value) => {
          return _.assign({ [value]: 0 })(acc)
        },
        {}
      )(_.difference(billFields, _.keys(it)))
      return _.assign(missingKeys, it)
    }
  )(bills)

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
    const objKey = key.match(/denomination|provisioned/g) ? key.replace(/_/g, '') : _.camelCase(key)
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

  if (_.every(_.isNil, _.at(BILL_FIELDS, newObj))) return newObj
  if (_.some(_.isNil, _.at(BILL_FIELDS, newObj))) throw new Error('Missing cassette values')

  const billFieldsArr = _.concat(
    _.map(it => ({ name: `cassette${it + 1}`, denomination: newObj[`denomination${it + 1}`], provisioned: newObj[`provisioned${it + 1}`] }))(_.range(0, MAX_CASSETTES)),
    _.reduce(
      (acc, value) => {
        acc.push(
          { name: `stacker${value + 1}f`, denomination: newObj[`denomination${value + 1}f`], provisioned: newObj[`provisioned${value + 1}f`] },
          { name: `stacker${value + 1}r`, denomination: newObj[`denomination${value + 1}r`], provisioned: newObj[`provisioned${value + 1}r`] }
        )
        return acc
      },
      []
    )(_.range(0, MAX_STACKERS))
  )

  // There can't be bills with denomination === 0.
  // If a bill has denomination === 0, then that cassette is not set and should be filtered out.
  const bills = _.filter(it => it.denomination > 0, billFieldsArr)

  return _.set('bills', bills, _.omit(BILL_FIELDS, newObj))
}

function redeemableTxs (deviceId) {
  const sql = `select * from cash_out_txs
  where device_id=$1
  and redeem=$2
  and dispense=$3
  and (
    provisioned_1 is not null or provisioned_2 is not null or provisioned_3 is not null or provisioned_4 is not null or
    provisioned_1f is not null or provisioned_1r is not null or provisioned_2f is not null or provisioned_2r is not null or provisioned_3f is not null or provisioned_3r is not null
  )
  and extract(epoch from (now() - greatest(created, confirmed_at))) < $4`

  return db.any(sql, [deviceId, true, false, REDEEMABLE_AGE])
    .then(_.map(toObj))
}
