const db = require('./db')

// Get all blacklist rows from the DB "blacklist" table that were manually inserted by the operator
const getBlacklist = () => {
  return db.any(`SELECT * FROM blacklist WHERE created_by_operator = 't'`).then(res =>
    res.map(item => ({
      cryptoCode: item.crypto_code,
      address: item.address,
      createdByOperator: item.created_by_operator
    }))
  )
}

// Delete row from blacklist table by crypto code and address
const deleteFromBlacklist = (cryptoCode, address) => {
  const sql = `DELETE FROM blacklist WHERE crypto_code = $1 AND address = $2;
  UPDATE notifications SET valid = 'f', read = 't' WHERE valid = 't' AND detail IN ($3^)`

  const detail = `'${cryptoCode}_BLOCKED_${address}', '${cryptoCode}_REUSED_${address}'`
  return db.none(sql, [cryptoCode, address, detail])
}

const insertIntoBlacklist = (cryptoCode, address) => {
  return db
    .none(
      'insert into blacklist(crypto_code, address, created_by_operator) values($1, $2, $3);',
      [cryptoCode, address, true]
    )
}

function blocked (address, cryptoCode) {
  const sql = `select * from blacklist where address = $1 and crypto_code = $2`
  return db.any(sql, [address, cryptoCode])
}

function addToUsedAddresses (address, cryptoCode) {
  // ETH reuses addresses
  if (cryptoCode === 'ETH') return Promise.resolve()

  const sql = `insert into blacklist(crypto_code, address, created_by_operator) values ($1, $2, 'f')`
  return db.oneOrNone(sql, [cryptoCode, address])
}

module.exports = {
  blocked,
  addToUsedAddresses,
  getBlacklist,
  deleteFromBlacklist,
  insertIntoBlacklist
}
