const db = require('./db')

function getTokenList () {
  const sql = `select * from user_tokens`
  return db.$any(sql)
}

function revokeToken (token) {
  const sql = `delete from user_tokens where token = $1`
  return db.$none(sql, [token])
}

module.exports = { getTokenList, revokeToken }
