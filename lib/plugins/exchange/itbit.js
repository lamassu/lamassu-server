const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('@lamassu/coins')

const ORDER_TYPE = ORDER_TYPES.LIMIT
const { BTC, ETH, USDT, LN } = COINS
const CRYPTO = [BTC, ETH, USDT, LN]
const FIAT = ['USD']
const DEFAULT_FIAT_MARKET = 'USD'
const AMOUNT_PRECISION = 4
const REQUIRED_CONFIG_FIELDS = ['clientKey', 'clientSecret', 'userId', 'walletId', 'currencyMarket']

const loadConfig = (account) => {
  const mapper = {
    'clientKey': 'apiKey',
    'clientSecret': 'secret',
    'userId': 'uid'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(_.omit(['walletId'], account))
  return { ...mapped, timeout: 3000 }
}
const loadOptions = ({ walletId }) => ({ walletId })

module.exports = { loadOptions, loadConfig, DEFAULT_FIAT_MARKET, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
