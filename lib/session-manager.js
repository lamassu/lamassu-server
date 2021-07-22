const db = require('./db')

function getSessions () {
  const sql = `SELECT * FROM user_sessions ORDER BY sess -> 'user' ->> 'username'`
  return db.any(sql)
}

function getLastSessionPerUser () {
  const sql = `SELECT b.username, a.user_agent, a.ip_address, a.last_used, b.role FROM (
    SELECT sess -> 'user' ->> 'username' AS username,
    sess ->> 'ua' AS user_agent,
    sess ->> 'ipAddress' AS ip_address,
    sess ->> 'lastUsed' AS last_used
    FROM user_sessions
    ) a RIGHT JOIN (
    SELECT DISTINCT ON (username)
    username, role
    FROM users) b ON a.username = b.username`
  return db.any(sql)
}

function getSessionsByUsername (username) {
  const sql = `SELECT * FROM user_sessions WHERE sess -> 'user' ->> 'username'=$1`
  return db.any(sql, [username])
}

function getSessionById (sessionID) {
  const sql = `SELECT * FROM user_sessions WHERE sid=$1`
  return db.any(sql, [sessionID])
}

function deleteSessionsByUsername (username) {
  const sql = `DELETE FROM user_sessions WHERE sess -> 'user' ->> 'username'=$1`
  return db.none(sql, [username])
}

function deleteSessionById (sessionID) {
  const sql = `DELETE FROM user_sessions WHERE sid=$1`
  return db.none(sql, [sessionID])
}

module.exports = { getSessions, getLastSessionPerUser, getSessionsByUsername, getSessionById, deleteSessionsByUsername, deleteSessionById }
