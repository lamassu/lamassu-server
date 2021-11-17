const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const crypto = require('crypto')
const argon2 = require('argon2')
const uuid = require('uuid')

const constants = require('./constants')
const db = require('./db')

/**
 * Get user by token
 *
 * @name get
 * @function
 *
 * @param {string} token User's token to query by
 *
 * @returns {user object} User object (containing name)
 */
function get (token) {
  const sql = 'SELECT * FROM user_tokens WHERE token=$1'
  return db.oneOrNone(sql, [token])
}

/**
 * Get multiple users given an array of ids
 *
 * @name getByIds
 * @function
 *
 * @param {array} ids Array with users' ids
 *
 * @returns {array} Array of users found
 */
function getByIds (ids) {
  const sql = `SELECT * FROM users WHERE id IN ($1^)`
  const idList = _.map(pgp.as.text, ids).join(',')
  return db.any(sql, [idList])
}

function getUserById (id) {
  const sql = `SELECT * FROM users WHERE id=$1`
  return db.oneOrNone(sql, [id])
}

function getUserByUsername (username) {
  const sql = `SELECT * FROM users WHERE username=$1`
  return db.oneOrNone(sql, [username])
}

function getUsers () {
  const sql = `SELECT id, username, role, enabled, last_accessed, last_accessed_from, last_accessed_address FROM users ORDER BY username`
  return db.any(sql)
}

function verifyAndUpdateUser (id, ua, ip) {
  const sql = `SELECT id, username, role, enabled FROM users WHERE id=$1 limit 1`
  return db.oneOrNone(sql, [id])
    .then(user => {
      if (!user) return null

      const sql2 = `UPDATE users SET last_accessed=now(), last_accessed_from=$1, last_accessed_address=$2 WHERE id=$3 RETURNING id, username, role, enabled`
      return db.one(sql2, [ua, ip, id])
    })
    .then(user => user)
}

function saveTemp2FASecret (id, secret) {
  const sql = 'UPDATE users SET temp_twofa_code=$1 WHERE id=$2'
  return db.none(sql, [secret, id])
}

function save2FASecret (id, secret) {
  return db.tx(t => {
    const q1 = t.none('UPDATE users SET twofa_code=$1, temp_twofa_code=NULL WHERE id=$2', [secret, id])
    const q2 = t.none(`DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`, [id])
    return t.batch([q1, q2])
  })
}

function validateAuthToken (token, type) {
  const sql = `SELECT user_id, now() < expire AS success FROM auth_tokens
    WHERE token=$1 AND type=$2`

  return db.one(sql, [token, type])
    .then(res => ({ userID: res.user_id, success: res.success }))
}

function reset2FASecret (token, id, secret) {
  return validateAuthToken(token, 'reset_twofa').then(res => {
    if (!res.success) throw new Error('Failed to verify 2FA reset token')
    return db.tx(t => {
      const q1 = t.none('UPDATE users SET twofa_code=$1, temp_twofa_code=NULL WHERE id=$2', [secret, id])
      const q2 = t.none(`DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`, [id])
      const q3 = t.none(`DELETE FROM auth_tokens WHERE token=$1 and type='reset_twofa'`, [token])
      return t.batch([q1, q2, q3])
    })
  })
}

function updatePassword (token, id, password) {
  return validateAuthToken(token, 'reset_password').then(res => {
    if (!res.success) throw new Error('Failed to verify password reset token')
    return argon2.hash(password).then(function (hash) {
      return db.tx(t => {
        const q1 = t.none(`UPDATE users SET password=$1 WHERE id=$2`, [hash, id])
        const q2 = t.none(`DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`, [id])
        const q3 = t.none(`DELETE FROM auth_tokens WHERE token=$1 and type='reset_password'`, [token])
        return t.batch([q1, q2, q3])
      })
    })
  })
}

function createUserRegistrationToken (username, role) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO user_register_tokens (token, username, role) VALUES ($1, $2, $3) ON CONFLICT (username)
    DO UPDATE SET token=$1, expire=now() + interval '${constants.REGISTRATION_TOKEN_EXPIRATION_TIME}' RETURNING *`

  return db.one(sql, [token, username, role])
}

function validateUserRegistrationToken (token) {
  const sql = `SELECT username, role, now() < expire AS success FROM user_register_tokens WHERE token=$1`

  return db.one(sql, [token])
    .then(res => ({ username: res.username, role: res.role, success: res.success }))
}

function register (token, username, password, role) {
  return validateUserRegistrationToken(token).then(res => {
    if (!res.success) throw new Error('Failed to verify registration token')
    return argon2.hash(password).then(hash => {
      return db.tx(t => {
        const q1 = t.none(`INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)`, [uuid.v4(), username, hash, role])
        const q2 = t.none(`DELETE FROM user_register_tokens WHERE token=$1`, [token])
        return t.batch([q1, q2])
      })
    })
  })
}

function changeUserRole (id, newRole) {
  const sql = `UPDATE users SET role=$1 WHERE id=$2`
  return db.none(sql, [newRole, id])
}

function enableUser (id) {
  const sql = `UPDATE users SET enabled=true WHERE id=$1`
  return db.none(sql, [id])
}

function disableUser (id) {
  return db.tx(t => {
    const q1 = t.none(`UPDATE users SET enabled=false WHERE id=$1`, [id])
    const q2 = t.none(`DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`, [id])
    return t.batch([q1, q2])
  })
}

module.exports = {
  get,
  getByIds,
  getUsers,
  getUserById,
  getUserByUsername,
  verifyAndUpdateUser,
  updatePassword,
  saveTemp2FASecret,
  save2FASecret,
  reset2FASecret,
  validateAuthToken,
  createUserRegistrationToken,
  validateUserRegistrationToken,
  register,
  changeUserRole,
  enableUser,
  disableUser
}
