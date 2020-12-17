const T = require('../time')

const PING = 'PING'
const STALE = 'STALE'
const LOW_CRYPTO_BALANCE = 'LOW_CRYPTO_BALANCE'
const HIGH_CRYPTO_BALANCE = 'HIGH_CRYPTO_BALANCE'
const CASH_BOX_FULL = 'CASH_BOX_FULL'
const LOW_CASH_OUT = 'LOW_CASH_OUT'

const CODES_DISPLAY = {
  PING: 'Machine Down',
  STALE: 'Machine Stuck',
  LOW_CRYPTO_BALANCE: 'Low Crypto Balance',
  HIGH_CRYPTO_BALANCE: 'High Crypto Balance',
  CASH_BOX_FULL: 'Cash box full',
  LOW_CASH_OUT: 'Low Cash-out'
}

const NETWORK_DOWN_TIME = 1 * T.minute
const STALE_STATE = 7 * T.minute
const ALERT_SEND_INTERVAL = T.hour

const NOTIFICATION_TYPES = {
  HIGH_VALUE_TX: 'highValueTransaction',
  FIAT_BALANCE: 'fiatBalance',
  CRYPTO_BALANCE: 'cryptoBalance',
  COMPLIANCE: 'compliance',
  ERROR: 'error'
}

module.exports = {
  PING,
  STALE,
  LOW_CRYPTO_BALANCE,
  HIGH_CRYPTO_BALANCE,
  CASH_BOX_FULL,
  LOW_CASH_OUT,
  CODES_DISPLAY,
  NETWORK_DOWN_TIME,
  STALE_STATE,
  ALERT_SEND_INTERVAL,
  NOTIFICATION_TYPES
}
