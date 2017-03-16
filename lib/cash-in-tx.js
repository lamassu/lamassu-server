const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const db = require('./db')
const BN = require('./bn')

const mapValuesWithKey = _.mapValues.convert({cap: false})

module.exports = {post}

const UPDATEABLE_FIELDS = ['fee', 'txHash', 'phone', 'error', 'send']

function post (tx, pi) {
  const TransactionMode = pgp.txMode.TransactionMode
  const isolationLevel = pgp.txMode.isolationLevel
  const tmSRD = new TransactionMode({tiLevel: isolationLevel.serializable})

  function transaction (t) {
    const sql = 'select * from cash_in_txs where id=$1'
    const sql2 = 'select * from bills where cash_in_txs_id=$1'

    console.log('DEBUG888: %j', tx)
    return t.oneOrNone(sql, [tx.id])
    .then(row => {
      return t.any(sql2, [tx.id])
      .then(billRows => {
        return upsert(row, tx)
        .then(vector => {
          return insertNewBills(billRows, tx)
          .then(newBills => _.concat(vector, [billRows]))
        })
      })
    })
  }

  transaction.txMode = tmSRD

  return db.tx(transaction)
  .then(txVector => {
    const [, newTx] = txVector
    return postProcess(txVector, pi)
    .then(changes => update(newTx, changes))
  })
}

function nilEqual (a, b) {
  if (_.isNil(a) && _.isNil(b)) return true

  return undefined
}

function diff (oldTx, newTx) {
  let updatedTx = {}

  UPDATEABLE_FIELDS.forEach(fieldKey => {
    console.log('DEBUG80: %j', [oldTx[fieldKey], newTx[fieldKey]])
    if (oldTx && _.isEqualWith(nilEqual, oldTx[fieldKey], newTx[fieldKey])) return

    // We never null out an existing field
    if (oldTx && _.isNil(newTx[fieldKey])) return

    updatedTx[fieldKey] = newTx[fieldKey]
  })

  return updatedTx
}

function toObj (row) {
  if (!row) return null

  const keys = _.keys(row)
  let newObj = {}

  keys.forEach(key => {
    const objKey = _.camelCase(key)
    if (key === 'crypto_atoms' || key === 'fiat') {
      newObj[objKey] = BN(row[key])
      return
    }

    newObj[objKey] = row[key]
  })

  newObj.direction = 'cashIn'

  return newObj
}

function convertBigNumFields (obj) {
  const convert = (value, key) => _.includes(key, ['cryptoAtoms', 'fiat'])
  ? value.toString()
  : value

  const convertKey = key => _.includes(key, ['cryptoAtoms', 'fiat'])
  ? key + '#'
  : key

  return _.mapKeys(convertKey, mapValuesWithKey(convert, obj))
}

function pullNewBills (billRows, tx) {
  if (_.isEmpty(tx.bills)) return []

  const toBill = _.mapKeys(_.camelCase)
  const bills = _.map(toBill, billRows)

  return _.differenceBy(_.get('id'), tx.bills, bills)
}

const massage = _.flow(_.omit(['direction', 'bills']), convertBigNumFields, _.mapKeys(_.snakeCase))

function insertNewBills (billRows, tx) {
  const bills = pullNewBills(billRows, tx)
  if (_.isEmpty(bills)) return Promise.resolve()

  const dbBills = _.map(massage, bills)
  const columns = _.keys(dbBills[0])
  console.log('DEBUG333: %j', dbBills)
  const sql = pgp.helpers.insert(dbBills, columns, 'bills')

  return db.none(sql)
  .then(() => bills)
}

function upsert (row, tx) {
  const oldTx = toObj(row)

  if (!oldTx) {
    return insert(tx)
    .then(newTx => [oldTx, newTx])
  }

  return update(tx, diff(oldTx, tx))
  .then(newTx => [oldTx, newTx])
}

function insert (tx) {
  const dbTx = massage(tx)

  console.log('DEBUG334: %j', dbTx)

  const sql = pgp.helpers.insert(dbTx, null, 'cash_in_txs') + ' returning *'
  return db.one(sql)
  .then(toObj)
}

// const tx = JSON.parse('{"id":"677ec2b7-8e7a-4efc-99fc-1c1aa1b6a3a6","fiat":"1","cryptoAtoms":"73100","bills":[{"id":"afc6103f-b8bf-4ef3-aa28-6bd14f0c2633","fiat":"1","fiatCode":"USD","cryptoAtoms":"73100","cryptoCode":"BTC","deviceTime":1489642154270,"cashInTxsId":"677ec2b7-8e7a-4efc-99fc-1c1aa1b6a3a6"}],"fiatCode":"USD","cryptoCode":"BTC","direction":"cashIn","toAddress":"1MyRmwUVffy5QC5NEbdu9u1Lb9pZkwcNGg","deviceId":"F2:9C:7F:2C:59:F6:3C:EB:C5:A7:AE:4D:C0:59:32:70:0B:9D:3D:FE"}')

// insert(tx)
// .then(console.log)
// .catch(err => {
//   console.log(err.stack)
//   process.exit(1)
// })

function update (tx, changes) {
  if (_.isEmpty(changes)) return Promise.resolve(tx)

  const dbChanges = massage(changes)
  console.log('DEBUG893: %j', dbChanges)
  const sql = pgp.helpers.update(dbChanges, null, 'cash_in_txs') +
    pgp.as.format(' where id=$1', [tx.id]) + ' returning *'

  return db.one(sql)
  .then(toObj)
}

function postProcess (txVector, pi) {
  const [oldTx, newTx] = txVector

  if (newTx.send && !oldTx.send) {
    return pi.sendCoins(newTx)
    .then(txHash => ({txHash}))
    .catch(error => {
      console.log('DEBUG895: %j', error)
      return {error}
    })
  }

  return Promise.resolve({})
}
