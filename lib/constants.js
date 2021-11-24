const T = require('./time')

const anonymousCustomer = {
  uuid: '47ac1184-8102-11e7-9079-8f13a7117867',
  name: 'anonymous'
}

const cassetteMaxCapacity = 500

const AUTHENTICATOR_ISSUER_ENTITY = 'Lamassu'
const AUTH_TOKEN_EXPIRATION_TIME = '30 minutes'
const REGISTRATION_TOKEN_EXPIRATION_TIME = '30 minutes'
const USER_SESSIONS_TABLE_NAME = 'user_sessions'
const USER_SESSIONS_CLEAR_INTERVAL = 1 * T.hour

const AUTOMATIC = 'automatic'
const MANUAL = 'manual'

const CASH_OUT_DISPENSE_READY = 'cash_out_dispense_ready'
const CONFIRMATION_CODE = 'sms_code'

module.exports = {
  anonymousCustomer,
  cassetteMaxCapacity,
  AUTHENTICATOR_ISSUER_ENTITY,
  AUTH_TOKEN_EXPIRATION_TIME,
  REGISTRATION_TOKEN_EXPIRATION_TIME,
  AUTOMATIC,
  MANUAL,
  USER_SESSIONS_TABLE_NAME,
  USER_SESSIONS_CLEAR_INTERVAL,
  CASH_OUT_DISPENSE_READY,
  CONFIRMATION_CODE
}
