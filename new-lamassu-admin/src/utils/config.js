import * as R from 'ramda'

const namespaces = {
  ADVANCED: 'advanced',
  CASH_IN: 'cashIn',
  CASH_OUT: 'cashOut',
  WALLETS: 'wallets',
  OPERATOR_INFO: 'operatorInfo',
  NOTIFICATIONS: 'notifications',
  LOCALE: 'locale',
  COMMISSIONS: 'commissions',
  COMPLIANCE: 'compliance',
  RECEIPT: 'receipt',
  COIN_ATM_RADAR: 'coinAtmRadar',
  TERMS_CONDITIONS: 'termsConditions',
  TRIGGERS_CONFIG: 'triggersConfig'
}

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

const fromNamespace = R.curry((key, config) =>
  R.compose(stripped(key), filtered(key))(config)
)

const toNamespace = R.curry((key, config) =>
  mapKeys(it => `${key}_${it}`)(config)
)

export { fromNamespace, toNamespace, namespaces }
