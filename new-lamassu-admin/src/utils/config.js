import * as R from 'ramda'

const mapKeys = R.curry((fn, obj) =>
  R.fromPairs(R.map(R.adjust(0, fn), R.toPairs(obj)))
)

const filterByKey = R.curry((fn, obj) =>
  R.fromPairs(R.filter(it => fn(it[0]), R.toPairs(obj)))
)

const stripl = R.curry((q, str) =>
  R.startsWith(q, str) ? str.slice(q.length) : str
)

const filtered = key => filterByKey(R.startsWith(`${key}_`))
const stripped = key => mapKeys(stripl(`${key}_`))

const fromServer = key => R.compose(stripped(key), filtered(key))
const toServer = key => mapKeys(it => `${key}_${it}`)

export { fromServer, toServer }
