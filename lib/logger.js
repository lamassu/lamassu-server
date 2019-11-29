const winston = require('winston')
const Postgres = require('./pg-transport')
const options = require('./options')

const logger = new winston.Logger({
  level: options.logLevel,
  transports: [
    new (winston.transports.Console)({ timestamp: true, colorize: true }),
    new Postgres({
      connectionString: options.postgresql,
      tableName: 'server_logs'
    })
  ],
  rewriters: [
    (...[,, meta]) => meta instanceof Error ? { message: meta.message, stack: meta.stack } : meta
  ]
})

logger.stream = {
  write: message => {
    logger.info(message.trim())
  }
}

module.exports = logger
