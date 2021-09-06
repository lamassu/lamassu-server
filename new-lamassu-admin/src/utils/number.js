import * as R from 'ramda'

const isValidNumber = R.both(R.is(Number), R.complement(R.equals(NaN)))

const transformNumber = value => (isValidNumber(value) ? value : null)

export { transformNumber }
