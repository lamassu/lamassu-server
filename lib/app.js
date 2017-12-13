const fs = require('fs')
const http = require('http')
const https = require('https')
const argv = require('minimist')(process.argv.slice(2))

const routes = require('./routes')
const logger = require('./logger')
const poller = require('./poller')
const settingsLoader = require('./settings-loader')
const options = require('./options')

const devMode = argv.dev || options.http

const version = require('../package.json').version
logger.info('Version: %s', version)

function run () {
  let count = 0

  const errorHandler = err => {
    count += 1
    logger.error(err)
    logger.error('[%d] Retrying in 10s...', count)
  }

  const runner = () => runOnce()
  .then(() => clearInterval(handler))
  .catch(errorHandler)

  const handler = setInterval(runner, 10000)
  return runner()
}

function runOnce () {
  return settingsLoader.loadLatest()
  .then(settings => {
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
      console.log('lamassu-server listening on port ' +
        port + ' ' + (devMode ? '(http)' : '(https)'))
    })

    localServer.listen(localPort, 'localhost', () => {
      console.log('lamassu-server listening on local port ' + localPort)
    })
  })
}

module.exports = {run}
