const mem = require('mem')
const configManager = require('./config-manager')
const ph = require('./plugin-helper')

const FETCH_INTERVAL = 10000
function getRates (settings, fiatCode, cryptoCode) {
  return Promise.resolve()
  .then(() => {
    const config = settings.config
    const plugin = configManager.cryptoScoped(cryptoCode, config).ticker

    const account = settings.accounts[plugin]
    const ticker = ph.load(ph.TICKER, plugin)

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
