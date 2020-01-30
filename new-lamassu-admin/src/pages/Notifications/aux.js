import * as R from 'ramda'

const SETUP_KEY = 'setup'
const TRANSACTION_ALERTS_KEY = 'transactionAlerts'
const HIGH_VALUE_TRANSACTION_KEY = 'highValueTransaction'
const FIAT_BALANCE_ALERTS_KEY = 'fiatBalanceAlerts'
const CASH_IN_FULL_KEY = 'cashInFull'
const CASH_OUT_EMPTY_KEY = 'cashOutEmpty'
const PERCENTAGE_KEY = 'percentage'
const NUMERARY_KEY = 'numerary'
const CASSETTE_1_KEY = 'cassete1'
const CASSETTE_2_KEY = 'cassete2'
const OVERRIDES_KEY = 'overrides'
const CRYPTO_BALANCE_ALERTS_KEY = 'cryptoBalanceAlerts'
const LOW_BALANCE_KEY = 'lowBalance'
const HIGH_BALANCE_KEY = 'highBalance'
const ADD_OVERRIDE_KEY = 'addOverride'

const isDisabled = (state, self) =>
  R.any(x => x === true, R.values(R.omit([self], state)))

export {
  SETUP_KEY,
  TRANSACTION_ALERTS_KEY,
  HIGH_VALUE_TRANSACTION_KEY,
  FIAT_BALANCE_ALERTS_KEY,
  CASH_IN_FULL_KEY,
  CASH_OUT_EMPTY_KEY,
  PERCENTAGE_KEY,
  NUMERARY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  OVERRIDES_KEY,
  CRYPTO_BALANCE_ALERTS_KEY,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  ADD_OVERRIDE_KEY,
  isDisabled
}
