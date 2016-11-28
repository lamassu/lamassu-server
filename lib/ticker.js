const mem = require('mem')
const configManager = require('./config-manager')
const settingsLoader = require('./settings-loader')

const FETCH_INTERVAL = 10000
function getRates (fiatCode, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const settings = settingsLoader.settings()
    const config = settings.config
    const plugin = configManager.cryptoScoped(cryptoCode, config).cryptoServices.ticker
    const account = settings.accounts[plugin]
    const ticker = require('lamassu-' + plugin)

    return ticker.ticker(account, fiatCode, cryptoCode)
    .then(r => ({
      rates: r.rates,
      timestamp: Date.now()
    }))
  })
}

module.exports = {
  getRates: mem(getRates, {maxAge: FETCH_INTERVAL})
}
