const fs = require('fs')
const http = require('http')
const https = require('https')
const argv = require('minimist')(process.argv.slice(2))

require('./environment-helper')
const { asyncLocalStorage, defaultStore } = require('./async-storage')
const routes = require('./routes')
const logger = require('./logger')
const poller = require('./poller')
const settingsLoader = require('./new-settings-loader')
const configManager = require('./new-config-manager')
const complianceTriggers = require('./compliance-triggers')
const ofac = require('./ofac/index')
const ofacUpdate = require('./ofac/update')

const KEY_PATH = process.env.KEY_PATH
const CERT_PATH = process.env.CERT_PATH

const devMode = argv.dev

const version = require('../package.json').version
logger.info('Version: %s', version)

function run () {
  const store = defaultStore()
  return asyncLocalStorage.run(store, () => {
    return new Promise((resolve, reject) => {
      let count = 0
      let handler

      const errorHandler = err => {
        count += 1
        logger.error(err)
        logger.error('[%d] Retrying in 10s...', count)
      }

      const runner = () => {
        settingsLoader.loadLatest()
          .then(settings => {
            clearInterval(handler)
            return loadSanctions(settings)
              .then(() => startServer(settings))
              .then(resolve)
          })
          .catch(errorHandler)
      }

      handler = setInterval(runner, 10000)
      runner()
    })
  })
}

function loadSanctions (settings) {
  return Promise.resolve()
    .then(() => {
      const triggers = configManager.getTriggers(settings.config)
      const hasSanctions = complianceTriggers.hasSanctions(triggers)

      if (!hasSanctions) return

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
      poller.setup(['public'])
      const httpsServerOptions = {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
        requestCert: true,
        rejectUnauthorized: false
      }

      const server = devMode
        ? http.createServer(routes.app)
        : https.createServer(httpsServerOptions, routes.app)

      const port = argv.port || 3000

      if (devMode) logger.info('In dev mode')

      server.listen(port, () => {
        logger.info('lamassu-server listening on port ' +
        port + ' ' + (devMode ? '(http)' : '(https)'))
      })
    })
}

module.exports = { run }
