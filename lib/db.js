const Pgp = require('pg-promise')
const uuid = require('uuid')
const _ = require('lodash/fp')
const psqlUrl = require('../lib/options').postgresql
const logger = require('./logger')
const eventBus = require('./event-bus')
const extendedQueries = require('./extendedQueries')
const { asyncLocalStorage, defaultStore } = require('./async-storage')

const pgp = Pgp({
  pgNative: true,
  schema: 'ERROR_SCHEMA',
  extend (obj, dbContext) {
    obj.taskEx = function () {
      const args = pgp.utils.taskArgs(arguments)
      const { schema } = args.options
      delete args.options.schema
      if (schema) {
        return obj.task.call(this, args.options, t => {
          return t.none('SET search_path to $1:name', [schema])
            .then(args.cb.bind(t, t))
        })
      }
      return Promise.reject(new Error('No schema selected, cannot complete query'))
    }
    obj.$query = (query, values, qrm) => extendedQueries.query(obj, query, values, qrm)
    obj.$result = (query, variables, cb, thisArg) => extendedQueries.result(obj, query, variables, cb, thisArg)
    obj.$many = (query, variables) => extendedQueries.many(obj, query, variables)
    obj.$manyOrNone = (query, variables) => extendedQueries.manyOrNone(obj, query, variables)
    obj.$oneOrNone = (query, variables) => extendedQueries.oneOrNone(obj, query, variables)
    obj.$one = (query, variables) => extendedQueries.one(obj, query, variables)
    obj.$none = (query, variables) => extendedQueries.none(obj, query, variables)
    obj.$any = (query, variables) => extendedQueries.any(obj, query, variables)
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
  const msgToSave = message || _.get('message', meta)

  const sql = `insert into server_logs
  (id, device_id, message, log_level, meta) values ($1, $2, $3, $4, $5) returning *`
  // need to set AsyncLocalStorage (ALS) for this function as well
  // because this module is imported before ALS is set up on app.js
  const store = defaultStore()
  asyncLocalStorage.run(store, () => {
    db.$one(sql, [uuid.v4(), '', msgToSave, level, meta])
      .then(_.mapKeys(_.camelCase))
  })
})

module.exports = db
