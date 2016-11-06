const winston = require('winston')

var logLevel = typeof process.env.LAMASSU_ENV === 'string'
? process.env.LAMASSU_ENV
: 'info'

const logger = new winston.Logger({
  level: logLevel,
  transports: [
    new (winston.transports.Console)({colorize: true})
  ]
})

// log version
var version = require('../package.json').version
logger.info('Version: %s', version)

module.exports = logger
