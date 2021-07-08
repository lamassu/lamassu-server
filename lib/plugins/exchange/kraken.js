const _ = require('lodash/fp')

const { ORDER_TYPES } = require('./consts')
const { COINS } = require('../../new-admin/config/coins')

const ORDER_TYPE = ORDER_TYPES.MARKET
const { BTC, BCH, DASH, ETH, LTC, ZEC } = COINS
const CRYPTO = [BTC, ETH, LTC, DASH, ZEC, BCH]
const FIAT = ['USD', 'EUR']
const AMOUNT_PRECISION = 6
const REQUIRED_CONFIG_FIELDS = ['apiKey', 'privateKey']
const USER_REF = 'userref'

const loadConfig = (account) => {
  const mapper = {
    'privateKey': 'secret'
  }
  const mapped = _.mapKeys(key => mapper[key] ? mapper[key] : key)(account)
  return { ...mapped, timeout: 3000 }
}

const loadOptions = () => ({ expiretm: '+60' })

module.exports = { USER_REF, loadOptions, loadConfig, REQUIRED_CONFIG_FIELDS, CRYPTO, FIAT, ORDER_TYPE, AMOUNT_PRECISION }
