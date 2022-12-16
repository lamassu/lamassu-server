import { ALL_CRYPTOS } from '@lamassu/coins'
import * as R from 'ramda'

const WARNING_LEVELS = {
  CLEAN: 'clean',
  PARTIAL: 'partial',
  IMPORTANT: 'important'
}

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
    const unavailableCryptosFiltered = R.difference(unavailableCryptos, [it]) // As the markets can have stablecoins to trade against other crypto, filter them out, as there can't be pairs such as USDT/USDT

    const unavailableMarketsStr =
      R.length(unavailableCryptosFiltered) > 1
        ? `${R.join(
            ', ',
            R.slice(0, -1, unavailableCryptosFiltered)
          )} and ${R.last(unavailableCryptosFiltered)}`
        : unavailableCryptosFiltered[0]

    const warningLevel = R.isEmpty(unavailableCryptosFiltered)
      ? WARNING_LEVELS.CLEAN
      : !R.isEmpty(unavailableCryptosFiltered) &&
        R.length(unavailableCryptosFiltered) < R.length(ALL_CRYPTOS)
      ? WARNING_LEVELS.PARTIAL
      : WARNING_LEVELS.IMPORTANT

    return {
      code: R.toUpper(it),
      display: R.toUpper(it),
      warning: warningLevel,
      warningMessage: !R.isEmpty(unavailableCryptosFiltered)
        ? `No market pairs available for ${unavailableMarketsStr}`
        : `All market pairs are available`
    }
  }, R.keys(markets))
}

export { secretTest, leadingZerosTest, buildCurrencyOptions }
