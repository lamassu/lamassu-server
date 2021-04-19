const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('../../new-admin/config/coins')

const ORDER_TYPE = ORDER_TYPES.LIMIT
const { BTC, ETH } = COINS
const CRYPTO = [BTC, ETH]
const FIAT = ['USD']
const AMOUNT_PRECISION = 4
const REQUIRED_CONFIG_FIELDS = ['clientKey', 'clientSecret', 'userId', 'walletId']

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
const loadTradeId = (options, id) => _.assign({}, options)

module.exports = { loadTradeId, loadOptions, loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
