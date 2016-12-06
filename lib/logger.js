const winston = require('winston')
const options = require('./options')

const logger = new winston.Logger({
  level: options.logLevel,
  transports: [
    new (winston.transports.Console)({timestamp: true, colorize: true})
  ]
})

// log version
var version = require('../package.json').version
logger.info('Version: %s', version)

module.exports = logger
