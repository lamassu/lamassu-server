const _ = require('lodash/fp')
const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const crypto = require('crypto')
const baseX = require('base-x')
const { parse, NIL } = require('uuid')
const csexp = require('@lamassu/csexp')

const db = require('../../db')
const pairing = require('../../pairing')

const ALPHA_BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const bsAlpha = baseX(ALPHA_BASE)

const CA_PATH = process.env.CA_PATH
const HOSTNAME = process.env.HOSTNAME

const PAIRING_VERSION = "0"

const unpair = pairing.unpair

/* NOTE: All values must be strings! */
const encodeTotem = _.flow(
  csexp.lists.objectToPlist,
  csexp.toCanonical,
)

function totem (name, operatorId, locationId) {
  return readFile(CA_PATH)
    .then(data => {
      const caHash = crypto.createHash('sha256').update(data).digest('hex')
      const token = crypto.randomBytes(32)
      const hexToken = token.toString('hex')
      const caHexToken = crypto.createHash('sha256').update(hexToken).digest('hex')
      const sql = 'insert into pairing_tokens (token, name, machine_location) values ($1, $3, $4), ($2, $3, $4)'

      return db.none(sql, [hexToken, caHexToken, name, locationId])
        .then(() => encodeTotem({
          version: PAIRING_VERSION,
          hostname: HOSTNAME,
          caHash,
          token: hexToken,
          identifier: operatorId,
        }))
    })
}

module.exports = { totem, unpair }
