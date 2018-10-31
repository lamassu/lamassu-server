const winston = require('winston')
const options = require('./options')
const _ = require('lodash/fp')

const logger = new winston.Logger({
  level: options.logLevel,
  transports: [
    new (winston.transports.Console)({ timestamp: true, colorize: true })
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
