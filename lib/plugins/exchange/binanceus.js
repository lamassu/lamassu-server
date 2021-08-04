const { COINS } = require('lamassu-coins')
const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, BCH, DASH, ETH, LTC, ZEC, USDT } = COINS
const CRYPTO = [BTC, ETH, LTC, DASH, ZEC, BCH, USDT]
const FIAT = ['USD']
const REQUIRED_CONFIG_FIELDS = ['apiKey', 'privateKey']

const loadConfig = (account) => {
  const mapper = {}
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

// Documentation mentions a mandatory field 'time', not sure how ccxt handles this, probably works if we send this via options

module.exports = { loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE }
