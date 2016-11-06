var http = require('http')
var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var routes = require('./routes')
var plugins = require('./plugins')
var logger = require('./logger')
var configManager = require('./config-manager')

const helmet = require('helmet')

const pair = require('./pair')

module.exports = function (options) {
  var app = express()
  var server

  app.use(helmet())
  app.use(bodyParser.json())

  const psqlUrl = options.postgresql
  if (!psqlUrl) {
    console.log('Missing postgresql entry in configuration file')
    process.exit(1)
  }

  const seedPath = options.seedPath || './seeds/seed.txt'
  plugins.init(psqlUrl, seedPath)

  console.log('DEBUG6')

  return configManager.load()
  .then(config => {
    plugins.configure(config)
    plugins.startPolling()
    plugins.startCheckingNotification()

    var authMiddleware

    if (options.https) {
      const serverOptions = {
        key: options.https.key,
        cert: options.https.cert,
        requestCert: true
      }

      server = https.createServer(serverOptions, app)

      authMiddleware = function (req, res, next) {
        const deviceId = req.connection.getPeerCertificate().fingerprint
        console.log(deviceId)

        return pair.isPaired(deviceId)
        .then(r => {
          if (r) {
            req.deviceId = deviceId
            return next()
          }

          throw new Error('Unauthorized')
        })
        .catch(e => res.status(403).end())
      }
    } else {
      server = http.createServer(app)

      authMiddleware = function (req, res, next) {
        return next()
      }
    }

    if (options.mock) logger.info('In mock mode')

    return server
  })
}
