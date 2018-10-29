const winston = require('winston')
const options = require('./options')
const _ = require('lodash')

const logger = new winston.Logger({
  level: options.logLevel,
  transports: [
    new (winston.transports.Console)({ timestamp: true, colorize: true })
  ],
  rewriters: [
    (...[,, meta]) => _.hasIn('toString', meta)
      ? meta.toString() : 'Error, no further information is available'
  ]
})

logger.stream = {
  write: message => {
    logger.info(message.trim())
  }
}

module.exports = logger
