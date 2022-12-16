const _ = require('lodash/fp')

const db = require('./db')
const notifierQueries = require('./notifier/queries')

const getBlacklist = () =>
  db.any(
    `SELECT blacklist.address AS address, blacklist_messages.content AS blacklistMessage
     FROM blacklist JOIN blacklist_messages
     ON blacklist.blacklist_message_id = blacklist_messages.id`
  )

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
  const sql = `SELECT address, content FROM blacklist b LEFT OUTER JOIN blacklist_messages bm ON bm.id = b.blacklist_message_id WHERE address = $1`
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
  getBlacklist,
  deleteFromBlacklist,
  insertIntoBlacklist,
  getMessages,
  editBlacklistMessage
}
