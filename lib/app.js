'use strict'

var http = require('http')
var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var LamassuConfig = require('lamassu-config')
var routes = require('./routes')
var plugins = require('./plugins')
var logger = require('./logger')

module.exports = function (options) {
  var app = express()
  var server
  var lamassuConfig

  const psqlUrl = options.postgresql
  if (!psqlUrl) {
    console.log('Missing postgresql entry in configuration file')
    process.exit(1)
  }

  lamassuConfig = new LamassuConfig(psqlUrl)

  const seedPath = options.seedPath || './seeds/seed.txt'
  plugins.init(psqlUrl, seedPath)

  lamassuConfig.load(function (err, config) {
    if (err) {
      logger.error('Loading config failed')
      throw err
    }

    plugins.configure(config)
    plugins.startPolling()
    plugins.startCheckingNotification()
  })

  lamassuConfig.on('configUpdate', function () {
    lamassuConfig.load(function (err, config) {
      if (err) {
        return logger.error('Error while reloading config')
      }

      plugins.configure(config)
      logger.info('Config reloaded')
    })
  })

  app.use(bodyParser.json())

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
      lamassuConfig.isAuthorized(routes.getDeviceId(req), function (err,
        device) {
        if (err) {
          res.json({err: 'Internal Server Error'})
          return next(err)
        }
        if (!device) {
          res.json(404, {err: 'Not Found'})
          return next(new Error('Device is unpaired'))
        }
        next()
      })
    }
  } else {
    server = http.createServer(app)

    authMiddleware = function (req, res, next) {
      req.device = {}
      return next()
    }
  }

  if (options.mock) logger.info('In mock mode')

  var localApp = express()
  localApp.use(bodyParser.json())
  var localServer = http.createServer(localApp)
  var localPort = 7070

  routes.init({
    app: app,
    localApp: localApp,
    lamassuConfig: lamassuConfig,
    plugins: plugins,
    authMiddleware: authMiddleware,
    // reloadConfigMiddleware: reloadConfigMiddleware,
    mock: options.mock
  })

  localServer.listen(7070, function () {
    console.log('lamassu-server is listening on local port %d', localPort)
  })

  return server
}
