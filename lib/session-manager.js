const db = require('./db')

function getSessionList () {
  const sql = `select * from user_sessions order by sess -> 'user' ->> 'username'`
  return db.any(sql)
}

function getLastSessionByUser () {
  const sql = `select b.username, a.user_agent, a.ip_address, a.last_used, b.role from (
    select sess -> 'user' ->> 'username' as username,
    sess ->> 'ua' as user_agent,
    sess ->> 'ipAddress' as ip_address,
    sess ->> 'lastUsed' as last_used
    from user_sessions
    ) a right join (
    select distinct on (username)
    username, role
    from users) b on a.username = b.username`
  return db.any(sql)
}

function getUserSessions (username) {
  const sql = `select * from user_sessions where sess -> 'user' ->> 'username'=$1`
  return db.any(sql, [username])
}

function getSession (sessionID) {
  const sql = `select * from user_sessions where sid=$1`
  return db.any(sql, [sessionID])
}

function deleteUserSessions (username) {
  const sql = `delete from user_sessions where sess -> 'user' ->> 'username'=$1`
  return db.none(sql, [username])
}

function deleteSession (sessionID) {
  const sql = `delete from user_sessions where sid=$1`
  return db.none(sql, [sessionID])
}

module.exports = { getSessionList, getLastSessionByUser, getUserSessions, getSession, deleteUserSessions, deleteSession }
