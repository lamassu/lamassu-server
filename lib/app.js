const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const loop = require('reoccur')

const routes = require('./routes')
const plugins = require('./plugins')
const logger = require('./logger')
var argv = require('minimist')(process.argv.slice(2))

const settingsLoader = require('./settings-loader')
const options = require('./options')

const devMode = argv.dev || argv.http || options.http

function run () {
  let count = 0
  return loop((recur, resolve, reject) => {
    return runOnce()
    .then(resolve)
    .catch(err => {
      count += 1
      logger.debug(err)
      logger.debug('[%d] Retrying in 10s...', count)
      setTimeout(recur, 10000)
    })
  })
}

function runOnce () {
  const app = express()
  const localApp = express()

  const seedPath = options.seedPath || './seeds/seed.txt'
  plugins.init(seedPath)

  return settingsLoader.load()
  .then(settings => {
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
}

module.exports = {run}
