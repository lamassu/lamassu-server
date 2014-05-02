var bunyan = require('bunyan');

var logLevel = process.env.LAMASSU_ENV === 'debug' ?
  'debug' :
  'info';

module.exports = bunyan.createLogger({name: 'lamassu-server', level: logLevel});