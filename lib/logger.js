const winston = require('winston')
const options = require('./options')

const logger = new winston.Logger({
  level: options.logLevel,
  transports: [
    new (winston.transports.Console)({timestamp: true, colorize: true})
  ]
})

logger.stream = {
  write: message => {
    logger.info(message.trim())
  }
}

module.exports = logger
