const uuid = require('uuid')
const _ = require('lodash/fp')

const db = require('./db')

const getCustomerNotes = customerId => {
  const sql = `SELECT * FROM customer_notes WHERE customer_id=$1 LIMIT 1`
  return db.oneOrNone(sql, [customerId]).then(res => _.mapKeys((_, key) => _.camelize(key), res))
}

const createCustomerNotes = (customerId, userId, content) => {
  const sql = `INSERT INTO customer_notes (id, customer_id, last_edited_by, last_edited_at, content) VALUES ($1, $2, $3, now(), $4)`
  return db.none(sql, [uuid.v4(), customerId, userId, content])
}

const updateCustomerNotes = (customerId, userId, content) => {
  const sql = `UPDATE customer_notes SET last_edited_at=now(), last_edited_by=$1, content=$2 WHERE customer_id=$3 RETURNING *`
  return db.any(sql, [userId, content, customerId])
    .then(res => {
      if (_.isEmpty(res)) {
        createCustomerNotes(customerId, userId, content)
      }
    })
}

module.exports = {
  getCustomerNotes,
  createCustomerNotes,
  updateCustomerNotes
}
