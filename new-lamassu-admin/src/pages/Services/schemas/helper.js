import { ALL_CRYPTOS } from '@lamassu/coins'
import * as R from 'ramda'

import { WARNING_LEVELS } from 'src/utils/constants'

const secretTest = (secret, message) => ({
  name: 'secret-test',
  message: message ? `The ${message} is invalid` : 'Invalid field',
  test(val) {
    if (R.isNil(secret) && R.isNil(val)) {
      return this.createError()
    }
    return true
  }
})

const leadingZerosTest = (value, context) => {
  if (
    R.startsWith('0', context.originalValue) &&
    R.length(context.originalValue) > 1
  ) {
    return context.createError()
  }
  return true
}

const buildCurrencyOptions = markets => {
  return R.map(it => {
    const unavailableCryptos = R.difference(ALL_CRYPTOS, markets[it])
    const unavailableMarkets = R.join(
      ', ',
      R.map(ite => `${ite}/${it}`, unavailableCryptos)
    )

    const warningLevel = R.isEmpty(unavailableCryptos)
      ? WARNING_LEVELS.CLEAN
      : !R.isEmpty(unavailableCryptos) &&
        R.length(unavailableCryptos) < R.length(ALL_CRYPTOS)
      ? WARNING_LEVELS.PARTIAL
      : WARNING_LEVELS.IMPORTANT

    return {
      code: R.toUpper(it),
      display: R.toUpper(it),
      warning: warningLevel,
      warningMessage: !R.isEmpty(unavailableMarkets)
        ? `No market pairs available for ${unavailableMarkets}`
        : `All market pairs are available`
    }
  }, R.keys(markets))
}

export { secretTest, leadingZerosTest, buildCurrencyOptions }
