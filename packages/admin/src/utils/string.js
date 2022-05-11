import * as R from 'ramda'

import S from './sanctuary'

const formatLong = value => {
  if (!value || value.length <= 20) return value

  return `${value.slice(0, 8)}(...)${value.slice(
    value.length - 8,
    value.length
  )}`
}

const toFirstLower = S.compose(S.joinWith(''))(R.adjust(0, S.toLower))
const toFirstUpper = S.compose(S.joinWith(''))(R.adjust(0, S.toUpper))
const onlyFirstToUpper = S.compose(toFirstUpper)(S.toLower)

const splitOnUpper = R.compose(
  S.splitOn(' '),
  R.replace(/([A-Z])/g, ' $1'),
  toFirstLower
)
const startCase = R.compose(
  S.joinWith(' '),
  S.map(onlyFirstToUpper),
  splitOnUpper
)

const singularOrPlural = (amount, singularStr, pluralStr) =>
  parseInt(amount) === 1 ? singularStr : pluralStr

export { startCase, onlyFirstToUpper, formatLong, singularOrPlural }
