const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const path = require('path')
const crypto = require('crypto')
const db = require('./db')

const CA_PATH = path.resolve(__dirname, '..', 'ca-cert.pem')

function totem (ipAddress) {
  return readFile(CA_PATH)
  .then(data => {
    const caHash = crypto.createHash('sha256').update(data).digest()
    const token = crypto.randomBytes(32)
    const ip = Buffer.from(ipAddress.split('.').map(s => parseInt(s, 10)))
    const buf = Buffer.concat([ip, caHash, token])
    const sql = 'insert into pairing_tokens (token) values ($1)'

    return db.none(sql, [token.toString('hex')])
    .then(() => buf.toString('base64'))
  })
}

function pair (token, deviceId) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
  .then(r => {
    if (r.expired) return false

    const pairSql = 'insert into paired_devices (device_id) values ($1)'
    return db.none(pairSql, [deviceId])
    .then(() => true)
  })
}

function isPaired (deviceId) {
  const sql = 'select device_id from paired_devices where device_id=$1'

  return db.one(sql, [deviceId])
  .then(() => true)
}

module.exports = {totem, pair, isPaired}
