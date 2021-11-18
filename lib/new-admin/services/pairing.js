const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const crypto = require('crypto')
const baseX = require('base-x')
const { parse, NIL } = require('uuid')

const options = require('../../options')
const db = require('../../db')
const pairing = require('../../pairing')

const ALPHA_BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const bsAlpha = baseX(ALPHA_BASE)

const unpair = pairing.unpair

function totem (name) {
  const caPath = options.caPath
  const cleanNil = [...parse(NIL)].map(it => it.toString(16).padStart(2, '0')).join('')
  const nilBuffer = Buffer.from(cleanNil, 'hex')

  return readFile(caPath)
    .then(data => {
      const caHash = crypto.createHash('sha256').update(data).digest()
      const token = Buffer.concat([crypto.randomBytes(32), nilBuffer])
      const hexToken = token.toString('hex')
      const caHexToken = crypto.createHash('sha256').update(hexToken).digest('hex')
      const buf = Buffer.concat([caHash, token, Buffer.from(options.hostname)])
      const sql = 'insert into pairing_tokens (token, name) values ($1, $3), ($2, $3)'

      return db.none(sql, [hexToken, caHexToken, name])
        .then(() => bsAlpha.encode(buf))
    })
}

module.exports = { totem, unpair }
