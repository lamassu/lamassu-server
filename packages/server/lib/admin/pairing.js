const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const crypto = require('crypto')
const baseX = require('base-x')

const db = require('../db')
const pairing = require('../pairing')

const ALPHA_BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const bsAlpha = baseX(ALPHA_BASE)

const CA_PATH = process.env.CA_PATH

const unpair = pairing.unpair

function totem (hostname, name) {
  return readFile(CA_PATH)
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

module.exports = {totem, unpair}
