const path = require('path')
const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')

const CA_PATH = path.resolve(__dirname, '..', 'certs', 'root-ca.crt.pem')

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
}

function pair (token, deviceId) {
  pullToken(token)
  .then(r => {
    if (r.expired) return false

    const insertSql = `insert into devices (device_id, name) values ($1, $2)
    on conflict (device_id)
    do update set name=$1, paired=TRUE, display=TRUE`

    return db.none(insertSql, [deviceId, r.name])
    .then(() => true)
  })
  .catch(() => false)
}

function authorizeCaDownload (caToken) {
  return pullToken(caToken)
}

function ca () {
  return readFile(CA_PATH)
}

function isPaired (deviceId) {
  const sql = 'select device_id from devices where device_id=$1 and paired=TRUE'

  return db.one(sql, [deviceId])
  .then(() => true)
}

module.exports = {pair, authorizeCaDownload, ca, isPaired}
