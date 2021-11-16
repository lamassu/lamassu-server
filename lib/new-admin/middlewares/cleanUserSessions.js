const { asyncLocalStorage } = require('../../async-storage')
const db = require('../../db')
const { USER_SESSIONS_TABLE_NAME } = require('../../constants')
const logger = require('../../logger')

const schemaCache = {}

const cleanUserSessions = (cleanInterval) => (req, res, next) => {
  const schema = asyncLocalStorage.getStore() ? asyncLocalStorage.getStore().get('schema') : null
  const now = Date.now()

  if (!schema) return next()
  if (schema && schemaCache.schema + cleanInterval > now) return next()

  logger.debug(`Clearing expired sessions for schema ${schema}`)
  return db.none('DELETE FROM $1^ WHERE expire < to_timestamp($2 / 1000.0)', [USER_SESSIONS_TABLE_NAME, now])
    .then(() => {
      schemaCache.schema = now
      return next()
    })
    .catch(next)
}

module.exports = cleanUserSessions
