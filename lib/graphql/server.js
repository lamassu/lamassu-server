const logger = require('../logger')

const https = require('https')
const { ApolloServer } = require('apollo-server-express')

const devMode = !!require('minimist')(process.argv.slice(2)).dev

module.exports = new ApolloServer({
  typeDefs: require('./types'),
  resolvers: require('./resolvers'),
  context: ({ req, res }) => ({
    deviceId: req.deviceId, /* lib/middlewares/populateDeviceId.js */
    deviceName: req.deviceName, /* lib/middlewares/authorize.js */
    operatorId: res.locals.operatorId, /* lib/middlewares/operatorId.js */
    pid: req.query.pid,
    settings: req.settings, /* lib/middlewares/populateSettings.js */
  }),
  uploads: false,
  playground: false,
  introspection: false,
  formatError: error => {
    logger.error(error)
    return error
  },
  debug: devMode,
  logger
})
