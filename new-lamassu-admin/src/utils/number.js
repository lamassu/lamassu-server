import * as R from 'ramda'

const isValidNumber = R.both(R.is(Number), R.complement(R.equals(NaN)))

const transformNumber = value => {
  console.log('value', value)
  return isValidNumber(value) ? value : null
}

export { transformNumber }
