const db = require('../../db')

function validateUser (username, password) {
  const sql = 'SELECT id, username FROM users WHERE username=$1 AND password=$2'
  const sqlUpdateLastAccessed = 'UPDATE users SET last_accessed = now() WHERE username=$1'

  return db.one(sql, [username, password])
    .then(user => {
      return db.none(sqlUpdateLastAccessed, [user.username])
        .then(() => user)
    })
    .catch(() => false)
}

module.exports = {
  validateUser
}
