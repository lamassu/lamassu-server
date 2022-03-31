import * as R from 'ramda'

const isValidNumber = R.both(R.is(Number), R.complement(R.equals(NaN)))

const transformNumber = value => (isValidNumber(value) ? value : null)

const defaultToZero = value =>
  isValidNumber(parseInt(value)) ? parseInt(value) : 0

const numberToFiatAmount = value =>
  value.toLocaleString('en-US', { maximumFractionDigits: 2 })

const numberToCryptoAmount = value =>
  value.toLocaleString('en-US', { maximumFractionDigits: 5 })

export {
  defaultToZero,
  transformNumber,
  numberToFiatAmount,
  numberToCryptoAmount
}
