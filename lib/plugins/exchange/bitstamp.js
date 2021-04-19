const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('../../new-admin/config/coins')

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

const loadTradeId = (options, id) => _.assign({}, options)

module.exports = { loadTradeId, loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
