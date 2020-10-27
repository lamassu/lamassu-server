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
  const sql = 'select * from user_tokens where token=$1'
  return db.oneOrNone(sql, [token])
}

/**
 * Get multiple users given an array of tokens
 *
 * @name getByIds
 * @function
 *
 * @param {array} tokens Array with users' tokens
 *
 * @returns {array} Array of users found
 */
function getByIds (tokens) {
  const sql = 'select * from user_tokens where token in ($1^)'
  const tokensClause = _.map(pgp.as.text, tokens).join(',')
  return db.any(sql, [tokensClause])
}

function getUsers () {
  const sql = `select id, username, role, enabled, last_accessed, last_accessed_from, last_accessed_address from users order by username`
  return db.any(sql)
}

function getByName (username) {
  const sql = `select id, username, role, last_accessed from users where username=$1 limit 1`
  return db.oneOrNone(sql, [username])
}

function verifyAndUpdateUser (id, ua, ip) {
  const sql = `select id, username, role, enabled from users where id=$1 limit 1`
  return db.oneOrNone(sql, [id]).then(user => {
    if (!user) return null

    const sql2 = `update users set last_accessed=now(), last_accessed_from=$1, last_accessed_address=$2 where id=$3 returning id, role, enabled`
    return db.one(sql2, [ua, ip, id]).then(user => {
      return user
    })
  })
}

function createUser (username, password, role) {
  const sql = `insert into users (id, username, password, role) values ($1, $2, $3, $4)`
  bcrypt.hash(password, 12).then(function (hash) {
    return db.none(sql, [uuid.v4(), username, hash, role])
  })
}

function deleteUser (id) {
  const sql = `delete from users where id=$1`
  const sql2 = `delete from user_sessions where sess -> 'user' ->> 'id'=$1`

  return db.none(sql, [id]).then(() => db.none(sql2, [id]))
}

function findById (id) {
  const sql = 'select id, username from users where id=$1'
  return db.oneOrNone(sql, [id])
}

function get2FASecret (id) {
  const sql = 'select id, username, twofa_code, role from users where id=$1'
  return db.oneOrNone(sql, [id])
}

function save2FASecret (id, secret) {
  const sql = 'update users set twofa_code=$1 where id=$2'
  const sql2 = `delete from user_sessions where sess -> 'user' ->> 'id'=$1`
  return db.none(sql, [secret, id]).then(() => db.none(sql2, [id]))
}

function validate2FAResetToken (token) {
  const sql = `delete from reset_twofa
    where token=$1
    returning user_id, now() < expire as success`

  return db.one(sql, [token])
    .then(res => ({ userID: res.user_id, success: res.success }))
}

function createReset2FAToken (userID) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `insert into reset_twofa (token, user_id) values ($1, $2) on conflict (user_id) do update set token=$1, expire=now() + interval '30 minutes' returning *`

  return db.one(sql, [token, userID])
}

function updatePassword (id, password) {
  bcrypt.hash(password, 12).then(function (hash) {
    const sql = `update users set password=$1 where id=$2`
    const sql2 = `delete from user_sessions where sess -> 'user' ->> 'id'=$1`
    return db.none(sql, [hash, id]).then(() => db.none(sql2, [id]))
  })
}

function validatePasswordResetToken (token) {
  const sql = `delete from reset_password
    where token=$1
    returning user_id, now() < expire as success`

  return db.one(sql, [token])
    .then(res => ({ userID: res.user_id, success: res.success }))
}

function createResetPasswordToken (userID) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `insert into reset_password (token, user_id) values ($1, $2) on conflict (user_id) do update set token=$1, expire=now() + interval '30 minutes' returning *`

  return db.one(sql, [token, userID])
}

function createUserRegistrationToken (username, role) {
  const token = crypto.randomBytes(32).toString('hex')
  const sql = `insert into user_register_tokens (token, username, role) values ($1, $2, $3) on conflict (username)
    do update set token=$1, expire=now() + interval '30 minutes' returning *`

  return db.one(sql, [token, username, role])
}

function validateUserRegistrationToken (token) {
  const sql = `delete from user_register_tokens where token=$1
    returning username, role, now() < expire as success`

  return db.one(sql, [token])
    .then(res => ({ username: res.username, role: res.role, success: res.success }))
}

function changeUserRole (id, newRole) {
  const sql = `update users set role=$1 where id=$2`
  return db.none(sql, [newRole, id])
}

function toggleUserEnable (id) {
  const sql = `update users set enabled=not enabled where id=$1`
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
