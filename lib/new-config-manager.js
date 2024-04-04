const _ = require('lodash/fp')
const { validate } = require('uuid')

const namespaces = {
  ADVANCED: 'advanced',
  WALLETS: 'wallets',
  OPERATOR_INFO: 'operatorInfo',
  NOTIFICATIONS: 'notifications',
  LOCALE: 'locale',
  COMMISSIONS: 'commissions',
  RECEIPT: 'receipt',
  COIN_ATM_RADAR: 'coinAtmRadar',
  TERMS_CONDITIONS: 'termsConditions',
  CASH_OUT: 'cashOut',
  CASH_IN: 'cashIn',
  COMPLIANCE: 'compliance'
}

const stripl = _.curry((q, str) => _.startsWith(q, str) ? str.slice(q.length) : str)
const filter = namespace => _.pickBy((value, key) => _.startsWith(`${namespace}_`)(key))
const strip = key => _.mapKeys(stripl(`${key}_`))

const fromNamespace = _.curry((key, config) => _.compose(strip(key), filter(key))(config))
const toNamespace = _.curry((ns, config) => _.mapKeys(key => `${ns}_${key}`, config))

const getCommissions = (cryptoCode, deviceId, config) => {
  const commissions = fromNamespace(namespaces.COMMISSIONS)(config)
  const overrides = commissions.overrides

  if (_.isEmpty(overrides)) return _.omit('overrides', commissions)

  const specificFilter = it => it.machine === deviceId && _.includes(cryptoCode)(it.cryptoCurrencies)
  const specificAllCoinsFilter = it => it.machine === deviceId && _.includes('ALL_COINS')(it.cryptoCurrencies)
  const allMachinesFilter = it => it.machine === 'ALL_MACHINES' && _.includes(cryptoCode)(it.cryptoCurrencies)

  const specificOverrides = _.filter(specificFilter)(overrides)
  const specificAllCoinsOverrides = _.filter(specificAllCoinsFilter)(overrides)
  const allMachinesOverrides = _.filter(allMachinesFilter)(overrides)

  const priorityOrderOverrides = [
    commissions,
    ...allMachinesOverrides,
    ...specificAllCoinsOverrides,
    ...specificOverrides
  ]

  return _.omit('overrides', _.assignAll(priorityOrderOverrides))
}

const getLocale = (deviceId, it) => {
  const locale = fromNamespace(namespaces.LOCALE)(it)
  const filter = _.matches({ machine: deviceId })
  return _.omit('overrides', _.assignAll([locale, ..._.filter(filter)(locale.overrides)]))
}

const getGlobalLocale = it => getLocale(null, it)

const getWalletSettings = (key, it) => {
  const filter = _.matches({ cryptoCurrency: key })

  const getAdvancedSettings = it => {
    const advancedSettings = fromNamespace(namespaces.ADVANCED)(it)
    return _.omit(['overrides', 'cryptoCurrency', 'id'], _.assignAll([advancedSettings, ..._.filter(filter)(advancedSettings.overrides)]))
  }
  const walletsSettings = fromNamespace(namespaces.WALLETS)(it)
  return _.assign(fromNamespace(key)(walletsSettings), getAdvancedSettings(walletsSettings))
}
const getCashOut = (key, it) => _.compose(fromNamespace(key), fromNamespace(namespaces.CASH_OUT))(it)
const getGlobalCashOut = fromNamespace(namespaces.CASH_OUT)
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

  const smsSettings = fromNamespace('sms', notifications)
  const emailSettings = fromNamespace('email', notifications)
  const notificationCenterSettings = fromNamespace('notificationCenter', notifications)

  const notifNoOverrides = _.omit(['cryptoBalanceOverrides', 'fiatBalanceOverrides'], notifications)

  const findByCryptoCurrency = _.find(_.matches({ cryptoCurrency }))
  const findByMachine = _.find(_.matches({ machine }))

  const cryptoFields = ['cryptoHighBalance', 'cryptoLowBalance', 'highBalance', 'lowBalance']
  const fiatFields = ['cashInAlertThreshold', 'fillingPercentageCassette1', 'fillingPercentageCassette2', 'fillingPercentageCassette3', 'fillingPercentageCassette4']

  const getCryptoSettings = _.compose(_.pick(cryptoFields), _.defaultTo(notifications), findByCryptoCurrency)
  const cryptoSettings = getCryptoSettings(notifications.cryptoBalanceOverrides)

  if (cryptoSettings.highBalance) {
    cryptoSettings['cryptoHighBalance'] = cryptoSettings.highBalance
    delete cryptoSettings.highBalance
  }

  if (cryptoSettings.lowBalance) {
    cryptoSettings['cryptoLowBalance'] = cryptoSettings.lowBalance
    delete cryptoSettings.lowBalance
  }

  const fiatSettings = _.flow(
    findByMachine,
    _.assignWith(_.defaultTo, notifications),
    _.pick(fiatFields),
  )(notifications.fiatBalanceOverrides)
  return { ...notifNoOverrides, sms: smsSettings, email: emailSettings, ...cryptoSettings, ...fiatSettings, notificationCenter: notificationCenterSettings }
}

const getGlobalNotifications = config => getNotifications(null, null, config)

const getTriggers = _.get('triggers')

function getCustomerAuthenticationMethod(config) {
  return _.get('triggersConfig_customerAuthentication')(config)
}

/* `customInfoRequests` is the result of a call to `getCustomInfoRequests` */
const getTriggersAutomation = (customInfoRequests, config, oldFormat = false) => {
  return customInfoRequests
    .then(infoRequests => {
      const defaultAutomation = _.get('triggersConfig_automation')(config)
      const overrides = _.get('triggersConfig_overrides')(config)

      const requirements = {
        sanctions: defaultAutomation,
        idCardPhoto: defaultAutomation,
        idCardData: defaultAutomation,
        facephoto: defaultAutomation,
        usSsn: defaultAutomation
      }

      if (oldFormat) {
        _.forEach(it => { requirements[it.id] = defaultAutomation }, infoRequests)
        const oldRequirementsOverrides = _.reduce((acc, override) => _.assign(acc, { [override.requirement]: override.automation }), {}, overrides)
        return _.assign(requirements, oldRequirementsOverrides)
      }

      requirements.custom = []

      _.forEach(it => {
        requirements.custom.push({ id: it.id, type: defaultAutomation })
      }, infoRequests)

      const requirementsOverrides = _.reduce((acc, override) => {
        return _.assign(
          acc,
          !validate(override.requirement)
            ? { [override.requirement]: override.automation }
            : { custom: [...acc.custom ?? [], { id: override.requirement, type: override.automation }] }
        )
      }, {}, overrides)

      return _.assign(requirements, requirementsOverrides)
    })
}

const splitGetFirst = _.compose(_.head, _.split('_'))

const getCryptosFromWalletNamespace =
  _.compose(_.without(['advanced']), _.uniq, _.map(splitGetFirst), _.keys, fromNamespace('wallets'))

const getCashInSettings = config => fromNamespace(namespaces.CASH_IN)(config)

const getCryptoUnits = (crypto, config) => 
  getWalletSettings(crypto, config).cryptoUnits ?? 'full'

const setTermsConditions = toNamespace(namespaces.TERMS_CONDITIONS)

module.exports = {
  getWalletSettings,
  getCashInSettings,
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
  getTriggersAutomation,
  getGlobalCashOut,
  getCashOut,
  getCryptosFromWalletNamespace,
  getCryptoUnits,
  setTermsConditions,
  getCustomerAuthenticationMethod,
}
