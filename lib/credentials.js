const uuid = require('uuid')

const db = require('./db')

function createHardwareCredential (userID, credentialData) {
  const sql = `INSERT INTO hardware_credentials (id, user_id, data) VALUES ($1, $2, $3)`
  return db.none(sql, [uuid.v4(), userID, credentialData])
}

function getHardwareCredentials () {
  const sql = `SELECT * from hardware_credentials`
  return db.any(sql)
}

function getHardwareCredentialsOfUser (userID) {
  const sql = `SELECT * from hardware_credentials where user_id=$1`
  return db.any(sql, [userID])
}

function getUserByUserHandle (userHandle) {
  const sql = `SELECT users.id, users.username, users.role FROM users INNER JOIN hardware_credentials hc ON users.id=hc.user_id WHERE data->>'userHandle'=$1::jsonb::text`
  return db.oneOrNone(sql, [userHandle])
}

function updateHardwareCredential (credential) {
  const sql = `UPDATE hardware_credentials SET last_used=now(), data=$1 WHERE id=$2`
  return db.none(sql, [credential.data, credential.id])
}

module.exports = {
  createHardwareCredential,
  getHardwareCredentials,
  getHardwareCredentialsOfUser,
  getUserByUserHandle,
  updateHardwareCredential
}
