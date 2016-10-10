'use strict'

var http = require('http')
var https = require('https')
var express = require('express')
var bodyParser = require('body-parser')
var routes = require('./routes')
var plugins = require('./plugins')
var logger = require('./logger')
var configManager = require('./config-manager')

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

  configManager.load()
  .then(config => {
    console.log('DEBUG5: %j', config)
    plugins.configure(config)
    plugins.startPolling()
    plugins.startCheckingNotification()
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
      next()  // TODO: authentication
    }
  } else {
    server = http.createServer(app)

    authMiddleware = function (req, res, next) {
      req.device = {}
      console.log('DEBUG2')
      console.log(req.route)
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
