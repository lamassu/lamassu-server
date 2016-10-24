const path = require('path')
const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')

const CA_PATH = path.resolve(__dirname, '..', 'certs', 'root-ca.crt.pem')

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
  .then(r => r.expired)
}

function pair (token, deviceId) {
  pullToken(token)
  .then(valid => {
    if (!valid) return false

    const pairSql = 'insert into paired_devices (device_id) values ($1)'
    return db.none(pairSql, [deviceId])
    .then(() => true)
  })
}

function authorizeCaDownload (caToken) {
  return pullToken(caToken)
}

function ca () {
  return readFile(CA_PATH)
}

function isPaired (deviceId) {
  const sql = 'select device_id from paired_devices where device_id=$1'

  return db.one(sql, [deviceId])
  .then(() => true)
}

module.exports = {pair, authorizeCaDownload, ca, isPaired}
