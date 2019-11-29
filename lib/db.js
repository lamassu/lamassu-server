const Pgp = require('pg-promise')
const uuid = require('uuid')
const _ = require('lodash/fp')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')
const eventBus = require('./event-bus')

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

eventBus.subscribe('log', args => {
  const { level, message, meta } = args

  const sql = `insert into server_logs
  (id, device_id, message, log_level, meta) values ($1, $2, $3, $4, $5) returning *`

  db.one(sql, [uuid.v4(), '', message, level, meta])
    .then(_.mapKeys(_.camelCase))
})

module.exports = db
