const common = require('../common/ccxt')
const _ = require('lodash/fp')
const consts = require('./consts')
const ORDER_TYPE = consts.ORDER_TYPES.LIMIT
const FIAT = common.FIAT['kraken']
const CRYPTO = common.CRYPTO['kraken']

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
const isConfigValid = ({ clientKey, clientSecret, userId, walletId }) => clientKey && clientSecret && userId && walletId

const amountPrecision = () => 4

module.exports = { amountPrecision, loadOptions, loadConfig, isConfigValid, CRYPTO, FIAT, ORDER_TYPE }
