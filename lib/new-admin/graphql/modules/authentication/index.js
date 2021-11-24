const FIDO2FA = require('./FIDO2FAStrategy')
const FIDOPasswordless = require('./FIDOPasswordlessStrategy')
const FIDOUsernameless = require('./FIDOUsernamelessStrategy')

const STRATEGIES = {
  FIDO2FA,
  FIDOPasswordless,
  FIDOUsernameless
}

// FIDO2FA, FIDOPasswordless or FIDOUsernameless
const CHOSEN_STRATEGY = 'FIDO2FA'

module.exports = {
  CHOSEN_STRATEGY,
  strategy: STRATEGIES[CHOSEN_STRATEGY]
}
