const _ = require('lodash/fp')

const db = require('./db')
const notifierQueries = require('./notifier/queries')

const getBlacklist = () => {
  const blacklistSql = `SELECT * FROM blacklist`
  const messagesSql = `SELECT * FROM blacklist_messages`
  return Promise.all([db.any(blacklistSql), db.any(messagesSql)])
    .then(([blacklist, messages]) => Promise.all([_.map(_.mapKeys(_.camelCase), blacklist), _.map(_.mapKeys(_.camelCase), messages)]))
    .then(([blacklist, messages]) => _.map(it => ({ ...it, blacklistMessage: _.find(ite => it.blacklistMessageId === ite.id, messages) }), blacklist))
}

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

function getMessages () {
  const sql = `SELECT * FROM blacklist_messages`
  return db.any(sql)
}

function editBlacklistMessage (id, content) {
  const sql = `UPDATE blacklist_messages SET content = $1 WHERE id = $2 RETURNING id`
  return db.oneOrNone(sql, [content, id])
}

module.exports = {
  blocked,
  addToUsedAddresses,
  getBlacklist,
  deleteFromBlacklist,
  insertIntoBlacklist,
  getMessages,
  editBlacklistMessage
}
