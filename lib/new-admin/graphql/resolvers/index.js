const { mergeResolvers } = require('@graphql-tools/merge')

const bill = require('./bill.resolver')
const blacklist = require('./blacklist.resolver')
const cashbox = require('./cashbox.resolver')
const config = require('./config.resolver')
const currency = require('./currency.resolver')
const customer = require('./customer.resolver')
const customInfoRequests = require('./customInfoRequests.resolver')
const funding = require('./funding.resolver')
const log = require('./log.resolver')
const loyalty = require('./loyalty.resolver')
const machine = require('./machine.resolver')
const market = require('./market.resolver')
const notification = require('./notification.resolver')
const pairing = require('./pairing.resolver')
const rates = require('./rates.resolver')
const sanctions = require('./sanctions.resolver')
const scalar = require('./scalar.resolver')
const settings = require('./settings.resolver')
const sms = require('./sms.resolver')
const status = require('./status.resolver')
const transaction = require('./transaction.resolver')
const user = require('./users.resolver')
const version = require('./version.resolver')

const resolvers = [
  bill,
  blacklist,
  cashbox,
  config,
  currency,
  customer,
  customInfoRequests,
  funding,
  log,
  loyalty,
  machine,
  market,
  notification,
  pairing,
  rates,
  sanctions,
  scalar,
  settings,
  sms,
  status,
  transaction,
  user,
  version
]

module.exports = mergeResolvers(resolvers)
