const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const db = require('./db')
const logger = require('./logger')
const uuid = require('uuid')

const CA_PATH = process.env.CA_PATH

// A machine on an older version (no multicassette code) could be paired with a server with multicassette code.
// This makes sure that the server stores a default value
const DEFAULT_NUMBER_OF_CASSETTES = 2
const DEFAULT_NUMBER_OF_RECYCLERS = 0

function pullToken (token) {
  const sql = `delete from pairing_tokens
    where token=$1
    returning name, created < now() - interval '1 hour' as expired`
  return db.one(sql, [token])
}

// TODO new-admin: We should remove all configs related to that device. This can get tricky.
function unpair (deviceId) {
  return db.tx(t => 
    t.none(`INSERT INTO unpaired_devices(id, device_id, name, model, paired, unpaired)
      SELECT $1, $2, d.name, d.model, d.created, now()
      FROM devices d
      WHERE device_id=$2`
    , [uuid.v4(), deviceId])
    .then(() => {
        const q1 = t.none(`DELETE FROM devices WHERE device_id=$1`, [deviceId])
        const q2 = t.none(`DELETE FROM machine_pings WHERE device_id=$1`, [deviceId])
        const q3 = t.none(`DELETE FROM machine_network_heartbeat WHERE device_id=$1`, [deviceId])
        const q4 = t.none(`DELETE FROM machine_network_performance WHERE device_id=$1`, [deviceId])
        return t.batch([q1, q2, q3, q4])
    })
  )
}

function pair (token, deviceId, machineModel, numOfCassettes = DEFAULT_NUMBER_OF_CASSETTES, numOfRecyclers = DEFAULT_NUMBER_OF_RECYCLERS) {
  return pullToken(token)
    .then(r => {
      if (r.expired) return false

      const insertSql = `insert into devices (device_id, name, number_of_cassettes, number_of_recyclers) values ($1, $2, $3, $4)
    on conflict (device_id)
    do update set paired=TRUE, display=TRUE`

      return db.none(insertSql, [deviceId, r.name, numOfCassettes, numOfRecyclers])
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

      return readFile(CA_PATH, {encoding: 'utf8'})
    })
}

function isPaired (deviceId) {
  const sql = 'select device_id, name from devices where device_id=$1 and paired=TRUE'

  return db.oneOrNone(sql, [deviceId])
    .then(row => row && row.device_id === deviceId ? row.name : false)
}

module.exports = {pair, unpair, authorizeCaDownload, isPaired}
