const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('../../new-admin/config/coins')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, ETH, LTC, BCH } = COINS
const CRYPTO = [BTC, ETH, LTC, BCH]
const FIAT = ['USD', 'EUR']
const AMOUNT_PRECISION = 8

const loadConfig = (account) => {
  const mapper = {
    'key': 'apiKey',
    'clientId': 'uid'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

const isConfigValid = options => {
  const requiredOptions = ['key', 'secret', 'clientId']
  const givenOptions = _.pick(requiredOptions, options)
  return _.isEqual(_.keys(givenOptions), requiredOptions)
}

module.exports = { loadConfig, isConfigValid, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
