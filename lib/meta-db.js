const Pgp = require('pg-promise')

const { PSQL_URL } = require('./constants')
const logger = require('./logger')

const pgp = Pgp({
  pgNative: true,
  schema: 'ultralight',
  error: (err, e) => {
    if (e.cn) logger.error('Database not reachable.')
    if (e.query) {
      logger.error(e.query)
      e.params && logger.error(e.params)
    }
    logger.error(err)
  }
})

const db = pgp(PSQL_URL)

module.exports = db
