const _ = require('lodash/fp')
const logger = require('./logger')

const namespaces = {
  WALLETS: 'wallets',
  OPERATOR_INFO: 'operatorInfo',
  NOTIFICATIONS: 'notifications',
  LOCALE: 'locale',
  COMMISSIONS: 'commissions',
  RECEIPT: 'receipt',
  COIN_ATM_RADAR: 'coinAtmRadar',
  TERMS_CONDITIONS: 'termsConditions',
  CASH_OUT: 'cashOut',
  COMPLIANCE: 'compliance'
}

const stripl = _.curry((q, str) => _.startsWith(q, str) ? str.slice(q.length) : str)
const filter = namespace => _.pickBy((value, key) => _.startsWith(`${namespace}_`)(key))
const strip = key => _.mapKeys(stripl(`${key}_`))

const fromNamespace = _.curry((key, config) => _.compose(strip(key), filter(key))(config))
const toNamespace = (key, config) => _.mapKeys(it => `${key}_${it}`)(config)

const resolveOverrides = (original, filter, overrides, overridesPath = 'overrides') => {
  if (_.isEmpty(overrides)) return original

  return _.omit(overridesPath, _.mergeAll([original, ..._.filter(filter)(overrides)]))
}

const getCommissions = (cryptoCode, deviceId, config) => {
  const commissions = fromNamespace(namespaces.COMMISSIONS)(config)

  const filter = it => it.machine === deviceId && _.includes(cryptoCode)(it.cryptoCurrencies)
  // TODO new-admin. We have a all machines override now
  return resolveOverrides(commissions, filter, commissions.overrides)
}

const getLocale = (deviceId, it) => {
  const locale = fromNamespace(namespaces.LOCALE)(it)

  const filter = _.matches({ machine: deviceId })
  return resolveOverrides(locale, filter, locale.overrides)
}

const getGlobalLocale = it => getLocale(null, it)

const getWalletSettings = (key, it) => _.compose(fromNamespace(key), fromNamespace(namespaces.WALLETS))(it)
const getCashOut = (key, it) => _.compose(fromNamespace(key), fromNamespace(namespaces.CASH_OUT))(it)
const getOperatorInfo = fromNamespace(namespaces.OPERATOR_INFO)
const getCoinAtmRadar = fromNamespace(namespaces.COIN_ATM_RADAR)
const getTermsConditions = fromNamespace(namespaces.TERMS_CONDITIONS)
const getReceipt = fromNamespace(namespaces.RECEIPT)
const getCompliance = fromNamespace(namespaces.COMPLIANCE)

const getAllCryptoCurrencies = (config) => {
  const locale = fromNamespace(namespaces.LOCALE)(config)
  const cryptos = locale.cryptoCurrencies
  const overridesCryptos = _.map(_.get('cryptoCurrencies'))(locale.overrides)
  return _.uniq(_.flatten([cryptos, ...overridesCryptos]))
}

const getNotifications = (cryptoCurrency, machine, config) => {
  const notifications = fromNamespace(namespaces.NOTIFICATIONS)(config)

  const cryptoFilter = _.matches({ cryptoCurrency })
  const withCryptoBalance = resolveOverrides(notifications, cryptoFilter, notifications.cryptoBalanceOverrides, 'cryptoBalanceOverrides')

  const fiatFilter = _.matches({ machine })
  const withFiatBalance = resolveOverrides(withCryptoBalance, fiatFilter, withCryptoBalance.fiatBalanceOverrides, 'fiatBalanceOverrides')

  const withSms = fromNamespace('sms', withFiatBalance)
  const withEmail = fromNamespace('email', withFiatBalance)

  const final = { ...withFiatBalance, sms: withSms, email: withEmail }
  return final
}

const getGlobalNotifications = config => getNotifications(null, null, config)

const getTriggers = _.get('triggers')

module.exports = {
  getWalletSettings,
  getOperatorInfo,
  getNotifications,
  getGlobalNotifications,
  getLocale,
  getGlobalLocale,
  getCommissions,
  getReceipt,
  getCompliance,
  getCoinAtmRadar,
  getTermsConditions,
  getAllCryptoCurrencies,
  getTriggers,
  getCashOut
}
