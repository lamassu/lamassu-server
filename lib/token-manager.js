const db = require('./db')

function getTokenList () {
  const sql = `select * from user_tokens`
  return db.any(sql)
}

function getLatestTokenByUser () {
  const sql = `select distinct on (name) name, last_accessed, user_agent from user_tokens order by name, last_accessed desc`
  return db.any(sql)
}

function getSpecificUserTokens (name) {
  const sql = `select * from user_tokens where name = $1`
  return db.any(sql, [name])
}

function revokeToken (token) {
  const sql = `delete from user_tokens where token = $1`
  return db.none(sql, [token])
}

function revokeUserTokens (name) {
  const sql = `delete from user_tokens where name = $1`
  return db.none(sql, [name])
}

module.exports = { getTokenList, getLatestTokenByUser, getSpecificUserTokens, revokeToken, revokeUserTokens }
