const db = require('./db')
const notifierQueries = require('./notifier/queries')

// Get all blacklist rows from the DB "blacklist" table that were manually inserted by the operator
const getBlacklist = () => {
  return db.$any(`SELECT * FROM blacklist`).then(res =>
    res.map(item => ({
      cryptoCode: item.crypto_code,
      address: item.address
    }))
  )
}

// Delete row from blacklist table by crypto code and address
const deleteFromBlacklist = (cryptoCode, address) => {
  const sql = `DELETE FROM blacklist WHERE crypto_code = $1 AND address = $2`
  notifierQueries.clearBlacklistNotification(cryptoCode, address)
  return db.$none(sql, [cryptoCode, address])
}

const insertIntoBlacklist = (cryptoCode, address) => {
  return db
    .$none(
      'INSERT INTO blacklist (crypto_code, address) VALUES ($1, $2);',
      [cryptoCode, address]
    )
}

function blocked (address, cryptoCode) {
  const sql = `SELECT * FROM blacklist WHERE address = $1 AND crypto_code = $2`
  return db.$any(sql, [address, cryptoCode])
}

function addToUsedAddresses (address, cryptoCode) {
  // ETH reuses addresses
  if (cryptoCode === 'ETH') return Promise.resolve()

  const sql = `INSERT INTO blacklist (crypto_code, address) VALUES ($1, $2)`
  return db.$oneOrNone(sql, [cryptoCode, address])
}

module.exports = {
  blocked,
  addToUsedAddresses,
  getBlacklist,
  deleteFromBlacklist,
  insertIntoBlacklist
}
