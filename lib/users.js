const _ = require('lodash/fp')
const pgp = require('pg-promise')()
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

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

function getUsers () {
  const sql = `SELECT id, username, role, enabled, last_accessed, last_accessed_from, last_accessed_address FROM users ORDER BY username`
  return db.any(sql)
}

function getByName (username) {
  const sql = `SELECT id, username, role, last_accessed FROM users WHERE username=$1 limit 1`
  return db.oneOrNone(sql, [username])
}

function verifyAndUpdateUser (id, ua, ip) {
  const sql = `SELECT id, username, role, enabled FROM users WHERE id=$1 limit 1`
  return db.oneOrNone(sql, [id]).then(user => {
    if (!user) return null

    const sql2 = `UPDATE users SET last_accessed=now(), last_accessed_from=$1, last_accessed_address=$2 WHERE id=$3 RETURNING id, role, enabled`
    return db.one(sql2, [ua, ip, id]).then(user => {
      return user
    })
  })
}

function createUser (username, password, role) {
  const sql = `INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)`
  bcrypt.hash(password, 12).then(function (hash) {
    return db.none(sql, [uuid.v4(), username, hash, role])
  })
}

function deleteUser (id) {
  const sql = `DELETE FROM users WHERE id=$1`
  const sql2 = `DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`

  return db.none(sql, [id]).then(() => db.none(sql2, [id]))
}

function findById (id) {
  const sql = 'SELECT id, username, role, last_accessed FROM users WHERE id=$1 limit 1'
  return db.oneOrNone(sql, [id])
}

function get2FAMethod (id) {
  const sql = `SELECT id, username, twofa_code FROM users WHERE id=$1`
  return db.oneOrNone(sql, [id])
}

function get2FASecret (id) {
  const sql = 'SELECT id, username, twofa_code, role FROM users WHERE id=$1'
  return db.oneOrNone(sql, [id])
}

function save2FASecret (id, secret) {
  const sql = 'UPDATE users SET twofa_code=$1 WHERE id=$2'
  const sql2 = `DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`
  return db.none(sql, [secret, id]).then(() => db.none(sql2, [id]))
}

function validate2FAResetToken (token) {
  const sql = `DELETE FROM reset_twofa
    WHERE token=$1
    RETURNING user_id, now() < expire AS success`

  return db.one(sql, [token])
    .then(res => ({ userID: res.user_id, success: res.success }))
}

function createReset2FAToken (userID) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO reset_twofa (token, user_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token=$1, expire=now() + interval '30 minutes' RETURNING *`

  return db.one(sql, [token, userID])
}

function updatePassword (id, password) {
  bcrypt.hash(password, 12).then(function (hash) {
    const sql = `UPDATE users SET password=$1 WHERE id=$2`
    const sql2 = `DELETE FROM user_sessions WHERE sess -> 'user' ->> 'id'=$1`
    return db.none(sql, [hash, id]).then(() => db.none(sql2, [id]))
  })
}

function validatePasswordResetToken (token) {
  const sql = `DELETE FROM reset_password
    WHERE token=$1
    RETURNING user_id, now() < expire AS success`

  return db.one(sql, [token])
    .then(res => ({ userID: res.user_id, success: res.success }))
}

function createResetPasswordToken (userID) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO reset_password (token, user_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token=$1, expire=now() + interval '30 minutes' RETURNING *`

  return db.one(sql, [token, userID])
}

function createUserRegistrationToken (username, role) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `INSERT INTO user_register_tokens (token, username, role) VALUES ($1, $2, $3) ON CONFLICT (username)
    DO UPDATE SET token=$1, expire=now() + interval '30 minutes' RETURNING *`

  return db.one(sql, [token, username, role])
}

function validateUserRegistrationToken (token) {
  const sql = `DELETE FROM user_register_tokens WHERE token=$1
    RETURNING username, role, now() < expire AS success`

  return db.one(sql, [token])
    .then(res => ({ username: res.username, role: res.role, success: res.success }))
}

function changeUserRole (id, newRole) {
  const sql = `UPDATE users SET role=$1 WHERE id=$2`
  return db.none(sql, [newRole, id])
}

function toggleUserEnable (id) {
  const sql = `UPDATE users SET enabled=not enabled WHERE id=$1`
  return db.none(sql, [id])
}

module.exports = {
  get,
  getByIds,
  getUsers,
  getByName,
  verifyAndUpdateUser,
  createUser,
  deleteUser,
  findById,
  get2FAMethod,
  updatePassword,
  get2FASecret,
  save2FASecret,
  validate2FAResetToken,
  createReset2FAToken,
  validatePasswordResetToken,
  createResetPasswordToken,
  createUserRegistrationToken,
  validateUserRegistrationToken,
  changeUserRole,
  toggleUserEnable
}
