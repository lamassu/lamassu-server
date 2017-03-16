const BigNumber = require('bignumber.js')

BigNumber.config({ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN})

function BN (s, radix) { return new BigNumber(s, radix) }
module.exports = BN
