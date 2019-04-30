const db = require('./db')

function blocked (address, cryptoCode) {
  const sql = `select * from blacklist where address = $1 and crypto_code = $2`
  return db.oneOrNone(sql, [
    address,
    cryptoCode
  ])
}

module.exports = { blocked }
