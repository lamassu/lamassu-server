const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')
const options = require('./options')
const logger = require('./logger')

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
}

function pair (token, deviceId) {
  return pullToken(token)
  .then(r => {
    if (r.expired) return false

    const insertSql = `insert into devices (device_id, name) values ($1, $2)
    on conflict (device_id)
    do update set name=$2, paired=TRUE, display=TRUE`

    return db.none(insertSql, [deviceId, r.name])
    .then(() => true)
  })
  .catch(err => {
    logger.debug(err)
    return false
  })
}

function authorizeCaDownload (caToken) {
  return pullToken(caToken)
  .then(r => {
    if (r.expired) throw new Error('Expired')

    const caPath = options.caPath
    return readFile(caPath, {encoding: 'utf8'})
  })
}

function isPaired (deviceId) {
  const sql = 'select device_id from devices where device_id=$1 and paired=TRUE'

  return db.one(sql, [deviceId])
  .then(() => true)
}

module.exports = {pair, authorizeCaDownload, isPaired}
