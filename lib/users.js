const db = require('./db')

function get (token) {
  const sql = 'select * from user_tokens where token=$1'
  return db.oneOrNone(sql, [token])
}

module.exports = { get }
