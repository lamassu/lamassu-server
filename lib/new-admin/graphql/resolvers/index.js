const { mergeResolvers } = require('@graphql-tools/merge')

const bill = require('./bill.resolver')
const blacklist = require('./blacklist.resolver')
const config = require('./config.resolver')
const currency = require('./currency.resolver')
const customer = require('./customer.resolver')
const funding = require('./funding.resolver')
const log = require('./log.resolver')
const machine = require('./machine.resolver')
const notification = require('./notification.resolver')
const pairing = require('./pairing.resolver')
const promo = require('./promo.resolver')
const rates = require('./rates.resolver')
const scalar = require('./scalar.resolver')
const settings = require('./settings.resolver')
const status = require('./status.resolver')
const transaction = require('./transaction.resolver')
const user = require('./users.resolver')
const version = require('./version.resolver')

const resolvers = [
  bill,
  blacklist,
  config,
  currency,
  customer,
  funding,
  log,
  machine,
  notification,
  pairing,
  promo,
  rates,
  scalar,
  settings,
  status,
  transaction,
  user,
  version
]

module.exports = mergeResolvers(resolvers)
