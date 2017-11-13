const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('./db')

/**
 * Get user by token
 *
 * @name get
 * @function
 *
 * @param {string} token User's token to query by
 *
 * @returns {user object} User object (containing name)
 */
function get (token) {
  const sql = 'select * from user_tokens where token=$1'
  return db.oneOrNone(sql, [token])
}

/**
 * Get multiple users given an array of tokens
 *
 * @name getByIds
 * @function
 *
 * @param {array} tokens Array with users' tokens
 *
 * @returns {array} Array of users found
 */
function getByIds (tokens) {
  const sql = 'select * from user_tokens where token in ($1^)'
  const tokensClause = _.map(pgp.as.text, tokens).join(',')
  return db.any(sql, [tokensClause])
}
module.exports = { get, getByIds }
