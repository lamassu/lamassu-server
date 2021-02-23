const Pgp = require('pg-promise')
const uuid = require('uuid')
const _ = require('lodash/fp')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')
const eventBus = require('./event-bus')
const extendedQueries = require('./extendedQueries')

const pgp = Pgp({
  pgNative: true,
  extend (obj, dbContext) {
    obj.$any = (query, tables, variables) => extendedQueries.any(obj, dbContext, query, tables, variables)
    obj.$one = (query, tables, variables) => extendedQueries.one(obj, dbContext, query, tables, variables)
    obj.$oneOrNone = (query, tables, variables) => extendedQueries.oneOrNone(obj, dbContext, query, tables, variables)
    obj.$many = (query, tables, variables) => extendedQueries.many(obj, dbContext, query, tables, variables)
    obj.$manyOrNone = (query, tables, variables) => extendedQueries.manyOrNone(obj, dbContext, query, tables, variables)
    obj.$none = (query, tables, variables) => extendedQueries.none(obj, dbContext, query, tables, variables)
    obj.$result = (query, tables, variables, cb) => extendedQueries.result(obj, dbContext, query, tables, variables, cb)
  },
  error: (err, e) => {
    if (e.cn) logger.error('Database not reachable.')
    if (e.query) {
      logger.error(e.query)
      e.params && logger.error(e.params)
    }
    logger.error(err)
  }
})

const db = pgp(psqlUrl)

eventBus.subscribe('log', args => {
  if (process.env.SKIP_SERVER_LOGS) return

  const { level, message, meta } = args
  const msgToSave = message ? message : _.get('message', meta)

  const sql = `insert into server_logs
  (id, device_id, message, log_level, meta) values ($1, $2, $3, $4, $5) returning *`

  db.one(sql, [uuid.v4(), '', msgToSave, level, meta])
    .then(_.mapKeys(_.camelCase))
})

module.exports = db
