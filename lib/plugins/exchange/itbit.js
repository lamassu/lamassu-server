const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('../../new-admin/config/coins')

const ORDER_TYPE = ORDER_TYPES.LIMIT
const { BTC, ETH } = COINS
const CRYPTO = [BTC, ETH]
const FIAT = ['USD']
const AMOUNT_PRECISION = 4

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

const isConfigValid = options => {
  const requiredOptions = ['clientKey', 'clientSecret', 'userId', 'walletId']
  const givenOptions = _.pick(requiredOptions, options)
  return _.isEqual(_.keys(givenOptions), requiredOptions)
}

module.exports = { loadOptions, loadConfig, isConfigValid, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
