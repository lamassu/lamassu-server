const winston = require('winston')
const Postgres = require('./pg-transport')
const { PSQL_URL } = require('./constants')

const LOG_LEVEL = process.env.LOG_LEVEL

const logger = new winston.Logger({
  level: LOG_LEVEL,
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true
    }),
    new Postgres({
      connectionString: PSQL_URL,
      tableName: 'server_logs',
      handleExceptions: true,
      humanReadableUnhandledException: true
    })
  ],
  rewriters: [
    (...[,, meta]) => meta instanceof Error ? { message: meta.message, stack: meta.stack, meta } : meta
  ],
  exitOnError: false
})

logger.stream = {
  write: message => {
    logger.info(message.trim())
  }
}

module.exports = logger
