import * as R from 'ramda'

import S from './sanctuary'

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

export { startCase, onlyFirstToUpper }
