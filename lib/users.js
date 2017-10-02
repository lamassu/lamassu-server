const _ = require('lodash/fp')
const pgp = require('pg-promise')()

const db = require('./db')

function get (token) {
  const sql = 'select * from user_tokens where token=$1'
  return db.oneOrNone(sql, [token])
}

function getByIds (tokens) {
  const sql = 'select * from user_tokens where token in ($1^)'
  const tokensClause = _.map(pgp.as.text, tokens).join(',')
  return db.any(sql, [tokensClause])
}
module.exports = { get, getByIds }
