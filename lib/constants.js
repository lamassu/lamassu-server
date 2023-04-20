const T = require('./time')

const POSTGRES_USER = process.env.POSTGRES_USER
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD
const POSTGRES_HOST = process.env.POSTGRES_HOST
const POSTGRES_PORT = process.env.POSTGRES_PORT
const POSTGRES_DB = process.env.POSTGRES_DB

const PSQL_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`

const anonymousCustomer = {
  uuid: '47ac1184-8102-11e7-9079-8f13a7117867',
  name: 'anonymous'
}

const CASH_UNIT_CAPACITY = {
  grandola: {
    cashbox: 2000,
    recycler: 2800
  },
  aveiro: {
    cashbox: 1500,
    stacker: 60,
    cassette: 500
  },
  tejo: {
    // TODO: add support for the different cashbox configuration in Tejo
    cashbox: 1000,
    cassette: 500
  },
  gaia: {
    cashbox: 600
  },
  sintra: {
    cashbox: 1000,
    cassette: 500
  }
}

const CASH_OUT_MINIMUM_AMOUNT_OF_CASSETTES = 2
const CASH_OUT_MAXIMUM_AMOUNT_OF_CASSETTES = 4
const AUTHENTICATOR_ISSUER_ENTITY = 'Lamassu'
const AUTH_TOKEN_EXPIRATION_TIME = '30 minutes'
const REGISTRATION_TOKEN_EXPIRATION_TIME = '30 minutes'
const USER_SESSIONS_TABLE_NAME = 'user_sessions'
const USER_SESSIONS_CLEAR_INTERVAL = 1 * T.hour

const AUTOMATIC = 'automatic'
const MANUAL = 'manual'

const CASH_OUT_DISPENSE_READY = 'cash_out_dispense_ready'
const CONFIRMATION_CODE = 'sms_code'
const RECEIPT = 'sms_receipt'

const WALLET_SCORE_THRESHOLD = 9

const BALANCE_FETCH_SPEED_MULTIPLIER = {
  NORMAL: 1,
  SLOW: 3
}

module.exports = {
  anonymousCustomer,
  CASH_UNIT_CAPACITY,
  AUTHENTICATOR_ISSUER_ENTITY,
  AUTH_TOKEN_EXPIRATION_TIME,
  REGISTRATION_TOKEN_EXPIRATION_TIME,
  AUTOMATIC,
  MANUAL,
  USER_SESSIONS_TABLE_NAME,
  USER_SESSIONS_CLEAR_INTERVAL,
  CASH_OUT_DISPENSE_READY,
  CONFIRMATION_CODE,
  CASH_OUT_MINIMUM_AMOUNT_OF_CASSETTES,
  CASH_OUT_MAXIMUM_AMOUNT_OF_CASSETTES,
  WALLET_SCORE_THRESHOLD,
  RECEIPT,
  PSQL_URL,
  BALANCE_FETCH_SPEED_MULTIPLIER
}
