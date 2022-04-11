const _ = require('lodash/fp')
const nmd = require('nano-markdown')

const { accounts: accountsConfig, countries, languages } = require('../new-admin/config')
const plugins = require('../plugins')
const configManager = require('../new-config-manager')
const customRequestQueries = require('../new-admin/services/customInfoRequests')
const state = require('../middlewares/state')

const urlsToPing = [
  `us.archive.ubuntu.com`,
  `uk.archive.ubuntu.com`,
  `za.archive.ubuntu.com`,
  `cn.archive.ubuntu.com`
]

const speedtestFiles = [
  {
    url: 'https://github.com/lamassu/speed-test-assets/raw/main/python-defaults_2.7.18-3.tar.gz',
    size: 44668
  }
]

const addSmthInfo = (dstField, srcFields) => smth =>
  smth && smth.active ? _.set(dstField, _.pick(srcFields, smth)) : _.identity

const addOperatorInfo = addSmthInfo(
  'operatorInfo',
  ['name', 'phone', 'email', 'website', 'companyNumber']
)

const addReceiptInfo = addSmthInfo(
  'receiptInfo',
  [
    'sms',
    'operatorWebsite',
    'operatorEmail',
    'operatorPhone',
    'companyNumber',
    'machineLocation',
    'customerNameOrPhoneNumber',
    'exchangeRate',
    'addressQRCode',
  ]
)

/* TODO: Simplify this. */
const buildTriggers = (allTriggers) => {
  const normalTriggers = []
  const customTriggers = _.filter(o => {
    if (_.isEmpty(o.customInfoRequestId) || _.isNil(o.customInfoRequestId)) normalTriggers.push(o)
    return !_.isNil(o.customInfoRequestId) && !_.isEmpty(o.customInfoRequestId)
  }, allTriggers)

  return _.flow(
    _.map(_.get('customInfoRequestId')),
    customRequestQueries.batchGetCustomInfoRequest
  )(customTriggers)
    .then(res => {
      res.forEach((details, index) => {
        // make sure we aren't attaching the details to the wrong trigger
        if (customTriggers[index].customInfoRequestId !== details.id) return
        customTriggers[index] = { ...customTriggers[index], customInfoRequest: details }
      })
      return [...normalTriggers, ...customTriggers]
    })
}

/*
 * TODO: From `lib/routes/termsAndConditionsRoutes.js` -- remove this after
 * terms are removed from the GraphQL API too.
 */
const massageTerms = terms => (terms.active && terms.text) ? ({
  delay: Boolean(terms.delay),
  title: terms.title,
  text: nmd(terms.text),
  accept: terms.acceptButtonText,
  cancel: terms.cancelButtonText,
}) : null

const staticConfig = (parent, { currentConfigVersion }, { deviceId, deviceName, settings }, info) =>
  Promise.all([
    plugins(settings, deviceId).staticConfigQueries(),
    !!configManager.getCompliance(settings.config).enablePaperWalletOnly,
    configManager.getTriggersAutomation(settings.config),
    buildTriggers(configManager.getTriggers(settings.config)),
    configManager.getWalletSettings('BTC', settings.config).layer2 !== 'no-layer2',
    configManager.getLocale(deviceId, settings.config),
    configManager.getOperatorInfo(settings.config),
    configManager.getReceipt(settings.config),
    massageTerms(configManager.getTermsConditions(settings.config)),
    !!configManager.getCashOut(deviceId, settings.config).active,
  ])
    .then(([
      staticConf,
      enablePaperWalletOnly,
      triggersAutomation,
      triggers,
      hasLightning,
      localeInfo,
      operatorInfo,
      receiptInfo,
      terms,
      twoWayMode,
    ]) =>
      (currentConfigVersion && currentConfigVersion >= staticConf.configVersion) ?
      null :
      _.flow(
        _.assign({
          enablePaperWalletOnly,
          triggersAutomation,
          triggers,
          hasLightning,
          localeInfo: {
            country: localeInfo.country,
            languages: localeInfo.languages,
            fiatCode: localeInfo.fiatCurrency
          },
          machineInfo: { deviceId, deviceName },
          twoWayMode,
          speedtestFiles,
          urlsToPing,
          terms,
        }),
        _.update('triggersAutomation', _.mapValues(_.eq('Automatic'))),
        addOperatorInfo(operatorInfo),
        addReceiptInfo(receiptInfo)
      )(staticConf))


const setZeroConfLimit = config => coin =>
  _.set(
    'zeroConfLimit',
    configManager.getWalletSettings(coin.cryptoCode, config).zeroConfLimit,
    coin
  )

const dynamicConfig = (parent, variables, { deviceId, operatorId, pid, settings }, info) => {
  state.pids = _.update(operatorId, _.set(deviceId, { pid, ts: Date.now() }), state.pids)
  return plugins(settings, deviceId)
    .dynamicConfigQueries()
    .then(_.flow(
      _.update('coins', _.map(setZeroConfLimit(settings.config))),
      _.set('reboot', !!pid && state.reboots?.[operatorId]?.[deviceId] === pid),
      _.set('shutdown', !!pid && state.shutdowns?.[operatorId]?.[deviceId] === pid),
      _.set('restartServices', !!pid && state.restartServicesMap?.[operatorId]?.[deviceId] === pid),
    ))
}


module.exports = {
  Query: {
    staticConfig,
    dynamicConfig
  }
}
