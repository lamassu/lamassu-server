const common = require('../common/ccxt')
const _ = require('lodash/fp')
const consts = require('./consts')
const ORDER_TYPE = consts.ORDER_TYPES.MARKET
const FIAT = common.FIAT['kraken']
const CRYPTO = common.CRYPTO['kraken']

const loadConfig = (account) => {
  const mapper = {
    'key': 'apiKey',
    'clientId': 'uid'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

const isConfigValid = ({ key, clientId, secret }) => key && secret && clientId

const amountPrecision = () => 8

module.exports = { loadConfig, isConfigValid, amountPrecision , CRYPTO, FIAT, ORDER_TYPE }
