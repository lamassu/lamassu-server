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
    const unavailableMarketsStr = `${R.join(
      ', ',
      R.slice(0, -1, unavailableCryptos)
    )} and ${R.last(unavailableCryptos)}`

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
      warningMessage: !R.isEmpty(unavailableCryptos)
        ? `No market pairs available for ${unavailableMarketsStr}`
        : `All market pairs are available`
    }
  }, R.keys(markets))
}

export { secretTest, leadingZerosTest, buildCurrencyOptions }
