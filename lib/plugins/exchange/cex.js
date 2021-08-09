const { COINS } = require('lamassu-coins')
const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, BCH, DASH, ETH, LTC, USDT } = COINS
const CRYPTO = [BTC, ETH, LTC, DASH, BCH, USDT]
const FIAT = ['USD', 'EUR']
const REQUIRED_CONFIG_FIELDS = ['apiKey', 'privateKey']

const loadConfig = (account) => {
  const mapper = {}
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

module.exports = { loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE }
