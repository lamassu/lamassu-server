const uuid = require('uuid')
const _ = require('lodash/fp')

const db = require('./db')

const getCustomerNotes = customerId => {
  const sql = `SELECT * FROM customer_notes WHERE customer_id=$1`
  return db.oneOrNone(sql, [customerId]).then(res => _.mapKeys((_, key) => _.camelize(key), res))
}

const createCustomerNote = (customerId, userId, title, content) => {
  const sql = `INSERT INTO customer_notes (id, customer_id, last_edited_by, last_edited_at, title, content) VALUES ($1, $2, $3, now(), $4, $5)`
  return db.none(sql, [uuid.v4(), customerId, userId, title, content])
}

const deleteCustomerNote = noteId => {
  const sql = `DELETE FROM customer_notes WHERE id=$1`
  return db.none(sql, [noteId])
}

const updateCustomerNote = (noteId, userId, content) => {
  const sql = `UPDATE customer_notes SET last_edited_at=now(), last_edited_by=$1, content=$2 WHERE id=$3`
  return db.none(sql, [userId, content, noteId])
}

module.exports = {
  getCustomerNotes,
  createCustomerNote,
  deleteCustomerNote,
  updateCustomerNote
}
