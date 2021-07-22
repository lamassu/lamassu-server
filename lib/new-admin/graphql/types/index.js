const { mergeTypeDefs } = require('@graphql-tools/merge')

const bill = require('./bill.type')
const blacklist = require('./blacklist.type')
const cashbox = require('./cashbox.type')
const config = require('./config.type')
const currency = require('./currency.type')
const customer = require('./customer.type')
const funding = require('./funding.type')
const log = require('./log.type')
const loyalty = require('./loyalty.type')
const machine = require('./machine.type')
const notification = require('./notification.type')
const pairing = require('./pairing.type')
const rates = require('./rates.type')
const scalar = require('./scalar.type')
const settings = require('./settings.type')
const status = require('./status.type')
const transaction = require('./transaction.type')
const user = require('./users.type')
const version = require('./version.type')

const types = [
  bill,
  blacklist,
  cashbox,
  config,
  currency,
  customer,
  funding,
  log,
  loyalty,
  machine,
  notification,
  pairing,
  rates,
  scalar,
  settings,
  status,
  transaction,
  user,
  version
]

module.exports = mergeTypeDefs(types)
