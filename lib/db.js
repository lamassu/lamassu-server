const Pgp = require('pg-promise')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')

const pgp = Pgp({
  pgNative: true,
  error: (err, e) => {
    if (e.cn) logger.error('Database not reachable.')
    if (e.query) {
      logger.error(e.query)
      logger.error(e.params)
    }
    logger.error(err)
  }
})

const db = pgp(psqlUrl)
module.exports = db
