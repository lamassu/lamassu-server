import * as R from 'ramda'

const ifNotNull = (value, valueIfNotNull) => {
  return R.isNil(value) ? '' : valueIfNotNull
}

export { ifNotNull }
