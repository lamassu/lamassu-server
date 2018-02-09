const Pgp = require('pg-promise')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')

const pgp = Pgp({
  pgNative: true,
  error: (err, e) => {
    if (e.cn) return logger.error('Database not reachable.')
    if (e.query) return
    logger.error(err)
  }
})

const db = pgp(psqlUrl)
module.exports = db
