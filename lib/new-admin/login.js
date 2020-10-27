const db = require('../db')

function checkUser (username) {
  const sql = 'select * from users where username=$1'
  return db.oneOrNone(sql, [username]).then(value => { return value.password }).catch(() => false)
}

function validateUser (username, password) {
  const sql = 'select id, username from users where username=$1 and password=$2'
  const sqlUpdateLastAccessed = 'update users set last_accessed = now() where username=$1'

  return db.oneOrNone(sql, [username, password])
    .then(user => { db.none(sqlUpdateLastAccessed, [user.username]); return user })
    .catch(() => false)
}

module.exports = {
  checkUser,
  validateUser
}
