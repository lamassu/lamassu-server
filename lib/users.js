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
  const sql = `SELECT u.id, u.username, user_roles.name AS role, u.enabled, u.last_accessed, u.last_accessed_from, u.last_accessed_address FROM users AS u
    LEFT OUTER JOIN user_roles ON u.role_id = user_roles.id
    WHERE u.id IN ($1^)`
  const idList = _.map(pgp.as.text, ids).join(',')
  return db.any(sql, [idList])
}

function getUserById (id) {
  const sql = `SELECT u.id, u.username, user_roles.name AS role, u.enabled, u.last_accessed, u.last_accessed_from, u.last_accessed_address FROM users AS u
    LEFT OUTER JOIN user_roles ON u.role_id = user_roles.id
    WHERE u.id=$1`
  return db.oneOrNone(sql, [id])
}

function getUserByUsername (username) {
  const sql = `SELECT u.id, u.username, u.password, user_roles.name AS role, u.enabled, u.last_accessed, u.last_accessed_from, u.last_accessed_address FROM users AS u
    LEFT OUTER JOIN user_roles ON u.role_id = user_roles.id
    WHERE u.username=$1`
  return db.oneOrNone(sql, [username])
}

function getUsers () {
  const sql = `SELECT u.id, u.username, user_roles.name AS role, u.enabled, u.last_accessed, u.last_accessed_from, u.last_accessed_address FROM users AS u
    LEFT OUTER JOIN user_roles ON u.role_id = user_roles.id
    ORDER BY u.username`
  return db.any(sql)
}

function verifyAndUpdateUser (id, ua, ip) {
  const sql = `SELECT u.id, u.username, user_roles.name AS role, u.enabled FROM users AS u
    LEFT OUTER JOIN user_roles ON u.role_id = user_roles.id
    WHERE u.id=$1 LIMIT 1`
  return db.oneOrNone(sql, [id])
    .then(user => {
      if (!user) return null

      const sql2 = `UPDATE users SET last_accessed=now(), last_accessed_from=$1, last_accessed_address=$2 WHERE id=$3`
      return db.none(sql2, [ua, ip, id])
        .then(() => user)
    })
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

function createUserRegistrationToken (username, roleId) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO user_register_tokens (token, username, role_id) VALUES ($1, $2, $3) ON CONFLICT (username)
    DO UPDATE SET token=$1, expire=now() + interval '${constants.REGISTRATION_TOKEN_EXPIRATION_TIME}' RETURNING *`

  return db.one(sql, [token, username, roleId])
}

function validateUserRegistrationToken (token) {
  const sql = `SELECT username, role_id, now() < expire AS success FROM user_register_tokens WHERE token=$1`

  return db.one(sql, [token])
    .then(res => ({ username: res.username, roleId: res.role_id, success: res.success }))
}

function register (token, username, password, roleId) {
  return validateUserRegistrationToken(token).then(res => {
    if (!res.success) throw new Error('Failed to verify registration token')
    return argon2.hash(password).then(hash => {
      return db.tx(t => {
        const q1 = t.none(`INSERT INTO users (id, username, password, role_id) VALUES ($1, $2, $3, $4)`, [uuid.v4(), username, hash, roleId])
        const q2 = t.none(`DELETE FROM user_register_tokens WHERE token=$1`, [token])
        return t.batch([q1, q2])
      })
    })
  })
}

function changeUserRole (id, newRole) {
  // TODO: Change the UI to be a dropdown with all possible roles, instead of a toggle
  // TODO: Change this query to directly receive the new role ID and not the role name
  const sql = `UPDATE users SET role_id = roles.id FROM (SELECT * FROM user_roles WHERE name = $1) AS roles WHERE users.id=$2`
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

function getRoles () {
  const sql = `SELECT * from user_roles`
  return db.any(sql)
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
  disableUser,
  getRoles
}
