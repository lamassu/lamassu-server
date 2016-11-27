const mem = require('mem')
const settingsLoader = require('./settings-loader')
const configManager = require('./config-manager')

const FETCH_INTERVAL = 10000
function getRates (fiatCode, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    return settingsLoader.settings()
    .then(settings => {
      const config = settings.config
      const plugin = configManager.cryptoScoped(cryptoCode, config).cryptoServices.ticker
      const account = settings.accounts.plugin
      const ticker = require('lamassu-' + plugin)

      return ticker.ticker(account, fiatCode, cryptoCode)
    })
  })
}

module.exports = {
  getRates: mem(getRates, {maxAge: FETCH_INTERVAL})
}
