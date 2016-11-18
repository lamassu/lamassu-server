const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const routes = require('./routes')
const plugins = require('./plugins')
const logger = require('./logger')
var argv = require('minimist')(process.argv.slice(2))

const configManager = require('./config-manager')
const options = require('./options')

const devMode = argv.dev || argv.http || options.http

function run () {
  const app = express()
  const localApp = express()

  const seedPath = options.seedPath || './seeds/seed.txt'
  plugins.init(seedPath)

  return configManager.load()
  .then(config => {
    plugins.configure(config)
    plugins.startPolling()
    plugins.startCheckingNotification()

    const httpsServerOptions = {
      key: fs.readFileSync(options.keyPath),
      cert: fs.readFileSync(options.certPath),
      requestCert: true
    }

    const server = devMode
    ? http.createServer(app)
    : https.createServer(httpsServerOptions, app)

    const port = 3000
    const localPort = 3030
    const localServer = http.createServer(localApp)

    if (options.devMode) logger.info('In dev mode')

    const opts = {
      app,
      localApp,
      devMode,
      plugins
    }

    routes.init(opts)

    server.listen(port, () => {
      console.log('lamassu-server listening on port ' +
        port + ' ' + (devMode ? '(http)' : '(https)'))
    })

    localServer.listen(localPort, 'localhost', () => {
      console.log('lamassu-server listening on local port ' + localPort)
    })
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
}

module.exports = {run}
