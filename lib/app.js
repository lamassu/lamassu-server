const fs = require('fs')
const http = require('http')
const https = require('https')
const argv = require('minimist')(process.argv.slice(2))

const routes = require('./routes')
const logger = require('./logger')
const poller = require('./poller')
const settingsLoader = require('./settings-loader')
const configManager = require('./config-manager')
const options = require('./options')
const ofac = require('./ofac/index')
const ofacUpdate = require('./ofac/update')

const devMode = argv.dev || options.http

const version = require('../package.json').version
logger.info('Version: %s', version)

function run () {
  let count = 0
  let handler

  const errorHandler = err => {
    count += 1
    logger.error(err)
    logger.error('[%d] Retrying in 10s...', count)
  }

  const runner = () =>
    settingsLoader.loadLatest()
      .then(settings => {
        clearInterval(handler)
        return loadSanctions(settings)
          .then(() => startServer(settings))
      })
      .catch(errorHandler)

  handler = setInterval(runner, 10000)
  return runner()
}

function loadSanctions (settings) {
  return Promise.resolve()
    .then(() => {
      const config = configManager.unscoped(settings.config)

      if (!config.sanctionsVerificationActive) return

      logger.info('Loading sanctions DB...')
      return ofacUpdate.update()
        .then(() => logger.info('Sanctions DB updated'))
        .then(ofac.load)
        .then(() => logger.info('Sanctions DB loaded'))
    })
}

function startServer (settings) {
  return Promise.resolve()
    .then(() => {
      poller.start(settings)

      const httpsServerOptions = {
        key: fs.readFileSync(options.keyPath),
        cert: fs.readFileSync(options.certPath),
        requestCert: true,
        rejectUnauthorized: false
      }

      const server = devMode
        ? http.createServer(routes.app)
        : https.createServer(httpsServerOptions, routes.app)

      const port = argv.port || 3000
      const localPort = 3030
      const localServer = http.createServer(routes.localApp)

      if (options.devMode) logger.info('In dev mode')

      server.listen(port, () => {
        logger.info('lamassu-server listening on port ' +
        port + ' ' + (devMode ? '(http)' : '(https)'))
      })

      localServer.listen(localPort, 'localhost', () => {
        logger.info('lamassu-server listening on local port ' + localPort)
      })
    })
}

module.exports = {run}
