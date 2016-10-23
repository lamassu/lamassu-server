'use strict'

var http = require('http')
var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var routes = require('./routes')
var plugins = require('./plugins')
var logger = require('./logger')
var configManager = require('./config-manager')

const pair = require('./pair')

module.exports = function (options) {
  var app = express()
  var server

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

    console.log('DEBUG9.3 ****************')

    app.use(bodyParser.json())

    console.log('DEBUG9 ****************')

    var authMiddleware

    if (options.https) {
      var serverOptions = {
        key: options.https.key,
        cert: options.https.cert,
        requestCert: true,
        secureProtocol: 'TLSv1_method',
        ciphers: 'AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
        honorCipherOrder: true
      }

      server = https.createServer(serverOptions, app)

      authMiddleware = function (req, res, next) {
        const deviceId = req.connection.getPeerCertificate().fingerprint

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

    var localApp = express()
    localApp.use(bodyParser.json())
    var localServer = http.createServer(localApp)
    var localPort = 7070

    console.log('DEBUG7 ****************')
    routes.init({
      app: app,
      localApp: localApp,
      plugins: plugins,
      authMiddleware: authMiddleware,
      // reloadConfigMiddleware: reloadConfigMiddleware,
      mock: options.mock
    })

    // localServer.listen(7070, 'localhost', function () {
    //   console.log('lamassu-server is listening on local port %d', localPort)
    // })

    return server
  })
  .catch(e => console.log(e.stack))
}
