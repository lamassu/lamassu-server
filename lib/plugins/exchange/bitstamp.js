const { COINS } = require('lamassu-coins')
const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, ETH, LTC, BCH } = COINS
const CRYPTO = [BTC, ETH, LTC, BCH]
const FIAT = ['USD', 'EUR']
const AMOUNT_PRECISION = 8
const REQUIRED_CONFIG_FIELDS = ['key', 'secret', 'clientId']

const loadConfig = (account) => {
  const mapper = {
    'key': 'apiKey',
    'clientId': 'uid'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

module.exports = { loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
