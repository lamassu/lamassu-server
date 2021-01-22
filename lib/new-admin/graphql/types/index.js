const { mergeTypeDefs } = require('@graphql-tools/merge')

const blacklist = require('./blacklist.type')
const config = require('./config.type')
const currency = require('./currency.type')
const customer = require('./customer.type')
const funding = require('./funding.type')
const log = require('./log.type')
const machine = require('./machine.type')
const pairing = require('./pairing.type')
const promo = require('./promo.type')
const scalar = require('./scalar.type')
const settings = require('./settings.type')
const status = require('./status.type')
const transaction = require('./transaction.type')
const version = require('./version.type')

const types = [
  blacklist,
  config,
  currency,
  customer,
  funding,
  log,
  machine,
  pairing,
  promo,
  scalar,
  settings,
  status,
  transaction,
  version
]

module.exports = mergeTypeDefs(types)
