import * as R from 'ramda'

const EMAIL_KEY = 'email'
const SMS_KEY = 'sms'
const BALANCE_KEY = 'balance'
const TRANSACTIONS_KEY = 'transactions'
const COMPLIANCE_KEY = 'compliance'
const SECURITY_KEY = 'security'
const ERRORS_KEY = 'errors'
const ACTIVE_KEY = 'active'
const SETUP_KEY = 'setup'
const CHANNEL_KEY = 'channel'
const TRANSACTION_ALERTS_KEY = 'transactionAlerts'
const HIGH_VALUE_TRANSACTION_KEY = 'highValueTransaction'
const FIAT_BALANCE_ALERTS_KEY = 'fiatBalanceAlerts'
const CASH_IN_FULL_KEY = 'cashInFull'
const CASH_OUT_EMPTY_KEY = 'cashOutEmpty'
const MACHINE_KEY = 'machine'
const PERCENTAGE_KEY = 'percentage'
const NUMERARY_KEY = 'numerary'
const CASSETTE_1_KEY = 'cassete1'
const CASSETTE_2_KEY = 'cassete2'
const OVERRIDES_KEY = 'overrides'
const CRYPTO_BALANCE_ALERTS_KEY = 'cryptoBalanceAlerts'
const LOW_BALANCE_KEY = 'lowBalance'
const HIGH_BALANCE_KEY = 'highBalance'
const ADD_OVERRIDE_FBA_KEY = 'addOverrideFBA'
const ADD_OVERRIDE_CBA_KEY = 'addOverrideCBA'

const isDisabled = (state, self) =>
  R.any(x => x === true, R.values(R.omit([self], state)))

export {
  EMAIL_KEY,
  SMS_KEY,
  BALANCE_KEY,
  TRANSACTIONS_KEY,
  COMPLIANCE_KEY,
  SECURITY_KEY,
  ERRORS_KEY,
  ACTIVE_KEY,
  SETUP_KEY,
  CHANNEL_KEY,
  TRANSACTION_ALERTS_KEY,
  HIGH_VALUE_TRANSACTION_KEY,
  FIAT_BALANCE_ALERTS_KEY,
  CASH_IN_FULL_KEY,
  CASH_OUT_EMPTY_KEY,
  MACHINE_KEY,
  PERCENTAGE_KEY,
  NUMERARY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  OVERRIDES_KEY,
  CRYPTO_BALANCE_ALERTS_KEY,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  ADD_OVERRIDE_FBA_KEY,
  ADD_OVERRIDE_CBA_KEY,
  isDisabled
}
