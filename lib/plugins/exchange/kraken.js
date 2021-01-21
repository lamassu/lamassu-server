const common = require('../common/ccxt')
const _ = require('lodash/fp')
const consts = require('./consts')
const ORDER_TYPE = consts.ORDER_TYPES.MARKET
const FIAT = common.FIAT['kraken']
const CRYPTO = common.CRYPTO['kraken']

const loadConfig = (account) => {
  const mapper = {
    'privateKey': 'secret'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

const loadOptions = () => ({ expiretm: '+60' })
const isConfigValid = ({ apiKey, privateKey }) => apiKey && privateKey

const amountPrecision = () => 6

module.exports = { amountPrecision, loadOptions, loadConfig, isConfigValid, CRYPTO, FIAT, ORDER_TYPE }
