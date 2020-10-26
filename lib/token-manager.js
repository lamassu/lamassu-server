const db = require('./db')

function getTokenList (browser, os) {
  const sql = `select * from user_tokens where browser_version=$1 and os_version=$2`
  return db.any(sql, [browser, os])
}

function revokeToken (token) {
  const sql = `delete from user_tokens where token = $1`
  return db.none(sql, [token])
}

module.exports = { getTokenList, revokeToken }
