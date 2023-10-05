const { COINS } = require('@lamassu/coins')
const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, BCH, XMR, ETH, LTC, ZEC, LN } = COINS
const CRYPTO = [BTC, ETH, LTC, ZEC, BCH, XMR, LN]
const FIAT = ['USD', 'EUR']
const REQUIRED_CONFIG_FIELDS = ['apiKey', 'privateKey']

const loadConfig = (account) => {
  const mapper = {
    'privateKey': 'secret'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

module.exports = { loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE }
