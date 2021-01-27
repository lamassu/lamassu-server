const db = require('../../db')

function checkUser (username) {
  const sql = 'SELECT * FROM users WHERE username=$1'
  return db.oneOrNone(sql, [username]).then(value => { return value.password }).catch(() => false)
}

function validateUser (username, password) {
  const sql = 'SELECT id, username FROM users WHERE username=$1 AND password=$2'
  const sqlUpdateLastAccessed = 'UPDATE users SET last_accessed = now() WHERE username=$1'

  return db.oneOrNone(sql, [username, password])
    .then(user => { db.none(sqlUpdateLastAccessed, [user.username]); return user })
    .catch(() => false)
}

module.exports = {
  checkUser,
  validateUser
}
