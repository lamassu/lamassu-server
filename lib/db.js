const Pgp = require('pg-promise')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')

const pgp = Pgp({
  pgNative: true,
  error: (_, e) => {
    if (e.cn) logger.error('Database not reachable.')
  }
})

const db = pgp(psqlUrl)
module.exports = db
