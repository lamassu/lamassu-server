const db = require('../../db')

function validateUser (username, password) {
  return db.tx(t => {
    const q1 = t.$one('SELECT * FROM users WHERE username=$1 AND password=$2', [username, password])
    const q2 = t.$none('UPDATE users SET last_accessed = now() WHERE username=$1', [username])

    return t.batch([q1, q2])
      .then(([user]) => user)
      .catch(() => false)
  })
}

module.exports = {
  validateUser
}
