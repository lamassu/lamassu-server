const db = require('./db')
const notifierQueries = require('./notifier/queries')

// Get all blacklist rows from the DB "blacklist" table that were manually inserted by the operator
const getBlacklist = () => {
  return db.any(`SELECT * FROM blacklist`).then(res =>
    res.map(item => ({
      address: item.address
    }))
  )
}

// Delete row from blacklist table by crypto code and address
const deleteFromBlacklist = address => {
  const sql = `DELETE FROM blacklist WHERE address = $1`
  notifierQueries.clearBlacklistNotification(address)
  return db.none(sql, [address])
}

const insertIntoBlacklist = address => {
  return db
    .none(
      'INSERT INTO blacklist (address) VALUES ($1);',
      [address]
    )
}

function blocked (address) {
  const sql = `SELECT * FROM blacklist WHERE address = $1`
  return db.any(sql, [address])
}

function addToUsedAddresses (address) {
  // ETH reuses addresses
  // if (cryptoCode === 'ETH') return Promise.resolve()

  const sql = `INSERT INTO blacklist (address) VALUES ($1)`
  return db.oneOrNone(sql, [address])
}

module.exports = {
  blocked,
  addToUsedAddresses,
  getBlacklist,
  deleteFromBlacklist,
  insertIntoBlacklist
}
