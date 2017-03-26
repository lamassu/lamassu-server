const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const crypto = require('crypto')
const baseX = require('base-x')

const options = require('../options')
const db = require('../db')

const ALPHA_BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const bsAlpha = baseX(ALPHA_BASE)

function unpair (deviceId) {
  const sql = 'update devices set paired=FALSE where device_id=$1'

  return db.none(sql, [deviceId])
}

function repair (deviceId) {
  const sql = 'update devices set paired=TRUE where device_id=$1'

  return db.none(sql, [deviceId])
}

function totem (hostname, name) {
  const caPath = options.caPath

  return readFile(caPath)
  .then(data => {
    const caHash = crypto.createHash('sha256').update(data).digest()
    const token = crypto.randomBytes(32)
    const hexToken = token.toString('hex')
    const caHexToken = crypto.createHash('sha256').update(hexToken).digest('hex')
    const buf = Buffer.concat([caHash, token, Buffer.from(hostname)])
    const sql = 'insert into pairing_tokens (token, name) values ($1, $3), ($2, $3)'

    return db.none(sql, [hexToken, caHexToken, name])
    .then(() => bsAlpha.encode(buf))
  })
}

module.exports = {totem, unpair, repair}
