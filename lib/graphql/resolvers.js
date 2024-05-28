const _ = require('lodash/fp')
const nmd = require('nano-markdown')

const plugins = require('../plugins')
const configManager = require('../new-config-manager')
const { batchGetCustomInfoRequest, getCustomInfoRequests } = require('../new-admin/services/customInfoRequests')
const state = require('../middlewares/state')
const { getMachine } = require('../machine-loader')

const VERSION = require('../../package.json').version

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
  (smth && smth.active) ? _.set(dstField, _.pick(srcFields, smth)) : _.identity

const addOperatorInfo = addSmthInfo(
  'operatorInfo',
  ['name', 'phone', 'email', 'website', 'companyNumber']
)

const addReceiptInfo = receiptInfo => ret => {
  if (!receiptInfo) return ret

  const fields = [
    'paper',
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
  const defaults = _.fromPairs(_.map(field => [field, false], fields))

  receiptInfo = _.flow(
    o => _.set('paper', o.active, o),
    _.assign(defaults),
    _.pick(fields),
  )(receiptInfo)

  return (receiptInfo.paper || receiptInfo.sms) ?
    _.set('receiptInfo', receiptInfo, ret) :
    ret
}


/* TODO: Simplify this. */
const buildTriggers = allTriggers => {
  const normalTriggers = []
  const customTriggers = _.filter(o => {
    if (_.isEmpty(o.customInfoRequestId) || _.isNil(o.customInfoRequestId)) normalTriggers.push(o)
    return !_.isNil(o.customInfoRequestId) && !_.isEmpty(o.customInfoRequestId)
  }, allTriggers)

  return _.flow(
    _.map(_.get('customInfoRequestId')),
    batchGetCustomInfoRequest
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

const staticConfig = ({ currentConfigVersion, deviceId, deviceName, pq, settings, }) => {
  const massageCoins = _.map(_.pick([
    'batchable',
    'cashInCommission',
    'cashInFee',
    'cashOutCommission',
    'cryptoCode',
    'cryptoCodeDisplay',
    'cryptoNetwork',
    'cryptoUnits',
    'display',
    'minimumTx',
    'isCashInOnly'
  ]))

  const staticConf = _.flow(
    _.pick([
      'coins',
      'configVersion',
      'timezone'
    ]),
    _.update('coins', massageCoins),
    _.set('serverVersion', VERSION),
  )(pq)

  return Promise.all([
    !!configManager.getCompliance(settings.config).enablePaperWalletOnly,
    configManager.getTriggersAutomation(getCustomInfoRequests(true), settings.config),
    buildTriggers(configManager.getTriggers(settings.config)),
    configManager.getWalletSettings('BTC', settings.config).layer2 !== 'no-layer2',
    configManager.getLocale(deviceId, settings.config),
    configManager.getOperatorInfo(settings.config),
    configManager.getReceipt(settings.config),
    !!configManager.getCashOut(deviceId, settings.config).active,
    getMachine(deviceId, currentConfigVersion),
    configManager.getCustomerAuthenticationMethod(settings.config)
  ])
    .then(([
      enablePaperWalletOnly,
      triggersAutomation,
      triggers,
      hasLightning,
      localeInfo,
      operatorInfo,
      receiptInfo,
      twoWayMode,
      { numberOfCassettes, numberOfRecyclers },
      customerAuthentication,
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
          machineInfo: { deviceId, deviceName, numberOfCassettes, numberOfRecyclers },
          twoWayMode,
          customerAuthentication,
          speedtestFiles,
          urlsToPing,
        }),
        addOperatorInfo(operatorInfo),
        addReceiptInfo(receiptInfo)
      )(staticConf))
}


const setZeroConfLimit = config => coin =>
  _.set(
    'zeroConfLimit',
    configManager.getWalletSettings(coin.cryptoCode, config).zeroConfLimit ?? 0,
    coin
  )

const dynamicConfig = ({ deviceId, operatorId, pid, pq, settings, }) => {
  const massageCassettes = cassettes =>
    cassettes ?
      _.flow(
        cassettes => _.set('physical', _.get('cassettes', cassettes), cassettes),
        cassettes => _.set('virtual', _.get('virtualCassettes', cassettes), cassettes),
        _.unset('cassettes'),
        _.unset('virtualCassettes')
      )(cassettes) :
      null

  const massageRecyclers = recyclers =>
    recyclers ?
      _.flow(
        recyclers => _.set('physical', _.get('recyclers', recyclers), recyclers),
        recyclers => _.set('virtual', _.get('virtualRecyclers', recyclers), recyclers),
        _.unset('recyclers'),
        _.unset('virtualRecyclers')
      )(recyclers) :
      null

  state.pids = _.update(operatorId, _.set(deviceId, { pid, ts: Date.now() }), state.pids)

  const res = _.flow(
    _.pick(['areThereAvailablePromoCodes', 'balances', 'cassettes', 'recyclers', 'coins', 'rates']),

    _.update('cassettes', massageCassettes),

    _.update('recyclers', massageRecyclers),

    /* [{ cryptoCode, rates }, ...] => [[cryptoCode, rates], ...] */
    _.update('coins', _.map(({ cryptoCode, rates }) => [cryptoCode, rates])),

    /* [{ cryptoCode: balance }, ...] => [[cryptoCode, { balance }], ...] */
    _.update('balances', _.flow(
      _.toPairs,
      _.map(([cryptoCode, balance]) => [cryptoCode, { balance }])
    )),

    /* Group the separate objects by cryptoCode */
    /* { balances, coins, rates } => { cryptoCode: { balance, ask, bid, cashIn, cashOut }, ... } */
    ({ areThereAvailablePromoCodes, balances, cassettes, recyclers, coins, rates }) => ({
      areThereAvailablePromoCodes,
      cassettes,
      recyclers,
      coins: _.flow(
        _.reduce(
          (ret, [cryptoCode, obj]) => _.update(cryptoCode, _.assign(obj), ret),
          rates
        ),

        /* { cryptoCode: { balance, ask, bid, cashIn, cashOut }, ... } => [[cryptoCode, { balance, ask, bid, cashIn, cashOut }], ...] */
        _.toPairs,

        /* [[cryptoCode, { balance, ask, bid, cashIn, cashOut }], ...] => [{ cryptoCode, balance, ask, bid, cashIn, cashOut }, ...] */
        _.map(([cryptoCode, obj]) => _.set('cryptoCode', cryptoCode, obj)),

        /* Only send coins which have all information needed by the machine. This prevents the machine going down if there's an issue with the coin node */
        _.filter(coin => ['ask', 'bid', 'balance', 'cashIn', 'cashOut', 'cryptoCode'].every(it => it in coin))
      )(_.concat(balances, coins))
    }),

    _.update('coins', _.map(setZeroConfLimit(settings.config))),
    _.set('reboot', !!pid && state.reboots?.[operatorId]?.[deviceId] === pid),
    _.set('shutdown', !!pid && state.shutdowns?.[operatorId]?.[deviceId] === pid),
    _.set('restartServices', !!pid && state.restartServicesMap?.[operatorId]?.[deviceId] === pid),
    _.set('emptyUnit', !!pid && state.emptyUnit?.[operatorId]?.[deviceId] === pid),
    _.set('refillUnit', !!pid && state.refillUnit?.[operatorId]?.[deviceId] === pid),
    _.set('diagnostics', !!pid && state.diagnostics?.[operatorId]?.[deviceId] === pid),
  )(pq)

  // Clean up the state middleware and prevent commands from being issued more than once
  if (!_.isNil(state.emptyUnit?.[operatorId]?.[deviceId])) {
    delete state.emptyUnit?.[operatorId]?.[deviceId]
  }

  if (!_.isNil(state.refillUnit?.[operatorId]?.[deviceId])) {
    delete state.refillUnit?.[operatorId]?.[deviceId]
  }

  if (!_.isNil(state.diagnostics?.[operatorId]?.[deviceId])) {
    delete state.diagnostics?.[operatorId]?.[deviceId]
  }

  return res
}


const configs = (parent, { currentConfigVersion }, { deviceId, deviceName, operatorId, pid, settings }, info) =>
  plugins(settings, deviceId)
    .pollQueries()
    .then(pq => ({
      static: staticConfig({
        currentConfigVersion,
        deviceId,
        deviceName,
        pq,
        settings,
      }),
      dynamic: dynamicConfig({
        deviceId,
        operatorId,
        pid,
        pq,
        settings,
      }),
    }))


const massageTerms = terms => (terms.active && terms.text) ? ({
  tcPhoto: Boolean(terms.tcPhoto),
  delay: Boolean(terms.delay),
  title: terms.title,
  text: nmd(terms.text),
  accept: terms.acceptButtonText,
  cancel: terms.cancelButtonText,
}) : null

/*
 * The type of the result of `configManager.getTermsConditions()` is more or
 * less `Maybe (Maybe Hash, Maybe TC)`. Each case has a specific meaning to the
 * machine:
 *
 * Nothing => Nothing
 *   There are no T&C or they've been removed/disabled.
 *
 * Just (Nothing, _) => Nothing
 *   Shouldn't happen! Treated as if there were no T&C.
 *
 * Just (Just hash, Nothing) => Nothing
 *   May happen (after `massageTerms`) if T&C are disabled.
 *
 * Just (Just hash, Just tc) => Just (hash, Nothing, Nothing)
 *   If both the `hash` and the `configVersion` are the same as `currentHash`
 *   and `currentConfigVersion`, respectively, then there's no need to send
 *   `text` nor `details`.
 *
 * Just (Just hash, Just tc) => Just (hash, Nothing, Just details)
 *   If `configVersion` differs from `currentConfigVersion` but the `hash` is
 *   the same, then only the details have to be updated.
 *
 * Just (Just hash, Just tc) => Just (hash, Just text, Just details)
 *   If the `hash` differs from `currentHash` then everything is resent (to
 *   simplify machine implementation).
 */
const terms = (parent, { currentConfigVersion, currentHash }, { deviceId, settings }, info) => {
  const isNone = x => _.isNil(x) || _.isEmpty(x)

  let latestTerms = configManager.getTermsConditions(settings.config)
  if (isNone(latestTerms)) return null

  const hash = latestTerms.hash
  if (!_.isString(hash)) return null

  latestTerms = massageTerms(latestTerms)
  if (isNone(latestTerms)) return null

  const isHashNew = hash !== currentHash
  const text = isHashNew ? latestTerms.text : null

  return plugins(settings, deviceId)
    .fetchCurrentConfigVersion()
    .catch(() => null)
    .then(configVersion => isHashNew || _.isNil(currentConfigVersion) || currentConfigVersion < configVersion)
    .then(isVersionNew => isVersionNew ? _.omit(['text'], latestTerms) : null)
    .then(details => ({ hash, details, text }))
}


module.exports = {
  Query: {
    configs,
    terms,
  }
}
