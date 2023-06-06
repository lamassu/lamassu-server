const express = require('express')
const nmd = require('nano-markdown')
const _ = require('lodash/fp')

const router = express.Router()

const complianceTriggers = require('../compliance-triggers')
const configManager = require('../new-config-manager')
const plugins = require('../plugins')
const semver = require('semver')
const state = require('../middlewares/state')
const version = require('../../package.json').version
const { batchGetCustomInfoRequest, getCustomInfoRequests } = require('../new-admin/services/customInfoRequests')

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

function checkHasLightning (settings) {
  return configManager.getWalletSettings('BTC', settings.config).layer2 !== 'no-layer2'
}

const createTerms = terms => (terms.active && terms.text) ? ({
  active: terms.active,
  title: terms.title,
  text: nmd(terms.text),
  accept: terms.acceptButtonText,
  cancel: terms.cancelButtonText
}) : null

const buildTriggers = (allTriggers) => {
  const normalTriggers = []
  const customTriggers = _.filter(o => {
    if (_.isEmpty(o.customInfoRequestId) || _.isNil(o.customInfoRequestId)) normalTriggers.push(o)
    return !_.isNil(o.customInfoRequestId) && !_.isEmpty(o.customInfoRequestId)
  }, allTriggers)

  return _.flow([_.map(_.get('customInfoRequestId')), batchGetCustomInfoRequest])(customTriggers)
    .then(res => {
      res.forEach((details, index) => {
        // make sure we aren't attaching the details to the wrong trigger
        if (customTriggers[index].customInfoRequestId !== details.id) return
        customTriggers[index] = { ...customTriggers[index], customInfoRequest: details }
      })
      return [...normalTriggers, ...customTriggers]
    })
}

function poll (req, res, next) {
  const machineVersion = req.query.version
  const machineModel = req.query.model
  const deviceId = req.deviceId
  const deviceTime = req.deviceTime
  const pid = req.query.pid
  const settings = req.settings
  const operatorId = res.locals.operatorId
  const localeConfig = configManager.getLocale(deviceId, settings.config)
  const zeroConfLimits = _.reduce((acc, cryptoCode) => {
    acc[cryptoCode] = configManager.getWalletSettings(cryptoCode, settings.config).zeroConfLimit
    return acc
  }, {}, localeConfig.cryptoCurrencies)
  const pi = plugins(settings, deviceId)
  const hasLightning = checkHasLightning(settings)

  const operatorInfo = configManager.getOperatorInfo(settings.config)
  const machineInfo = { deviceId: req.deviceId, deviceName: req.deviceName }
  const cashOutConfig = configManager.getCashOut(deviceId, settings.config)
  const receipt = configManager.getReceipt(settings.config)
  const terms = configManager.getTermsConditions(settings.config)
  const enablePaperWalletOnly = configManager.getCompliance(settings.config).enablePaperWalletOnly

  state.pids = _.update(operatorId, _.set(deviceId, { pid, ts: Date.now() }), state.pids)

  // BACKWARDS_COMPATIBILITY 8.1
  // Machines after 8.1 only need the server version from the initial polling request.
  if (semver.gte(machineVersion, '8.1.0-beta.0'))
    return res.json({ version })

  return Promise.all([
      pi.recordPing(deviceTime, machineVersion, machineModel),
      pi.pollQueries(),
      buildTriggers(configManager.getTriggers(settings.config)),
      configManager.getTriggersAutomation(getCustomInfoRequests(true), settings.config, true),
    ])
    .then(([_pingRes, results, triggers, triggersAutomation]) => {
      const reboot = pid && state.reboots?.[operatorId]?.[deviceId] === pid
      const shutdown = pid && state.shutdowns?.[operatorId]?.[deviceId] === pid
      const restartServices = pid && state.restartServicesMap?.[operatorId]?.[deviceId] === pid
      const emptyUnit = pid && state.emptyUnit?.[operatorId]?.[deviceId] === pid
      const refillUnit = pid && state.refillUnit?.[operatorId]?.[deviceId] === pid
      const langs = localeConfig.languages

      const locale = {
        fiatCode: localeConfig.fiatCurrency,
        localeInfo: {
          primaryLocale: langs[0],
          primaryLocales: langs,
          country: localeConfig.country
        }
      }

      const response = {
        error: null,
        locale,
        version,
        receiptPrintingActive: receipt.active,
        smsReceiptActive: receipt.sms,
        enablePaperWalletOnly,
        twoWayMode: cashOutConfig.active,
        zeroConfLimits,
        reboot,
        shutdown,
        restartServices,
        emptyUnit,
        refillUnit,
        hasLightning,
        receipt,
        operatorInfo,
        machineInfo,
        triggers,
        triggersAutomation,
        speedtestFiles,
        urlsToPing
      }

      // BACKWARDS_COMPATIBILITY 7.6
      // Machines before 7.6 expect a single zeroConfLimit value per machine.
      if (!semver.gte(machineVersion, '7.6.0-beta.0'))
        response.zeroConfLimit = _.min(_.values(zeroConfLimits))

      // BACKWARDS_COMPATIBILITY 7.5
      // machines before 7.5 expect old compliance
      if (!machineVersion || semver.lt(machineVersion, '7.5.0-beta.0')) {
        const compatTriggers = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
        response.smsVerificationActive = !!compatTriggers.sms
        response.smsVerificationThreshold = compatTriggers.sms
        response.idCardDataVerificationActive = !!compatTriggers.idCardData
        response.idCardDataVerificationThreshold = compatTriggers.idCardData
        response.idCardPhotoVerificationActive = !!compatTriggers.idCardPhoto
        response.idCardPhotoVerificationThreshold = compatTriggers.idCardPhoto
        response.sanctionsVerificationActive = !!compatTriggers.sanctions
        response.sanctionsVerificationThreshold = compatTriggers.sanctions
        response.frontCameraVerificationActive = !!compatTriggers.facephoto
        response.frontCameraVerificationThreshold = compatTriggers.facephoto
      }

      // BACKWARDS_COMPATIBILITY 7.4.9
      // machines before 7.4.9 expect t&c on poll
      if (!machineVersion || semver.lt(machineVersion, '7.4.9')) {
        response.terms = createTerms(terms)
      }

      return res.json(_.assign(response, results))
    })
    .catch(next)
}

router.get('/', poll)

module.exports = router
