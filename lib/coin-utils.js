const path = require('path')

const _ = require('lodash/fp')

const options = require('./options')

const CRYPTO_CURRENCIES = [
  {
    cryptoCode: 'BTC',
    display: 'Bitcoin',
    code: 'bitcoin',
    configFile: 'bitcoin.conf',
    daemon: 'bitcoind',
    defaultPort: 8332,
    unitScale: 8
  },
  {
    cryptoCode: 'ETH',
    display: 'Ethereum',
    code: 'ethereum',
    configFile: 'geth.conf',
    daemon: 'geth',
    defaultPort: 8545,
    unitScale: 18
  },
  {
    cryptoCode: 'LTC',
    display: 'Litecoin',
    code: 'litecoin',
    configFile: 'litecoin.conf',
    daemon: 'litecoind',
    defaultPort: 9332,
    unitScale: 8
  },
  {
    cryptoCode: 'DASH',
    display: 'Dash',
    code: 'dash',
    configFile: 'dash.conf',
    daemon: 'dashd',
    defaultPort: 9998,
    unitScale: 8
  },
  {
    cryptoCode: 'ZEC',
    display: 'Zcash',
    code: 'zcash',
    configFile: 'zcash.conf',
    daemon: 'zcashd',
    defaultPort: 8232,
    unitScale: 8
  },
  {
    cryptoCode: 'BCH',
    display: 'Bitcoin Cash',
    code: 'bitcoincash',
    configFile: 'bitcoincash.conf',
    daemon: 'bitcoincashd',
    defaultPort: 8335,
    unitScale: 8
  },
  {
    cryptoCode: 'DUC',
    display: 'Ducatus',
    code: 'ducatuscoin',
    configFile: 'ducatuscoin.conf',
    daemon: 'ducatuscoind',
    defaultPort: 9690,
    unitScale: 8
  }
]

module.exports = {buildUrl, cryptoDir, blockchainDir, configPath, cryptoCurrencies, getCryptoCurrency, toUnit}

function getCryptoCurrency (cryptoCode) {
  const cryptoCurrency = _.find(['cryptoCode', cryptoCode], CRYPTO_CURRENCIES)
  if (!cryptoCurrency) throw new Error(`Unsupported crypto: ${cryptoCode}`)
  return cryptoCurrency
}

function cryptoCurrencies () {
  return CRYPTO_CURRENCIES
}

function buildUrl (cryptoCode, address) {
  switch (cryptoCode) {
    case 'BTC': return `bitcoin:${address}`
    case 'ETH': return `ethereum:${address}`
    case 'ZEC': return `zcash:${address}`
    case 'LTC': return `litecoin:${address}`
    case 'DASH': return `dash:${address}`
    case 'BCH': return `${address}`
    case 'DUC': return `ducatus:${address}`
    default: throw new Error(`Unsupported crypto: ${cryptoCode}`)
  }
}

function blockchainDir () {
  return options.blockchainDir
}

function cryptoDir (cryptoRec) {
  const code = cryptoRec.code
  return path.resolve(blockchainDir(), code)
}

function configPath (cryptoRec) {
  return path.resolve(cryptoDir(cryptoRec), cryptoRec.configFile)
}

function toUnit (cryptoAtoms, cryptoCode) {
  const cryptoRec = getCryptoCurrency(cryptoCode)
  const unitScale = cryptoRec.unitScale
  return cryptoAtoms.shift(-unitScale)
}
