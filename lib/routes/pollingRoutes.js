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
const customRequestQueries = require('../new-admin/services/customInfoRequests')

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
    if (o.customInfoRequestId === '') normalTriggers.push(o)
    return o.customInfoRequestId !== ''
  }, allTriggers)

  return _.flow([_.map(_.get('customInfoRequestId')), customRequestQueries.batchGetCustomInfoRequest])(customTriggers)
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
  const serialNumber = req.query.sn
  const pid = req.query.pid
  const settings = req.settings
  const localeConfig = configManager.getLocale(deviceId, settings.config)
  const zeroConfLimits = _.reduce((acc, cryptoCode) => {
    acc[cryptoCode] = configManager.getWalletSettings(cryptoCode, settings.config).zeroConfLimit
    return acc
  }, {}, localeConfig.cryptoCurrencies)
  const pi = plugins(settings, deviceId)
  const hasLightning = checkHasLightning(settings)

  const triggersPromise = buildTriggers(configManager.getTriggers(settings.config))

  const operatorInfo = configManager.getOperatorInfo(settings.config)
  const machineInfo = { deviceId: req.deviceId, deviceName: req.deviceName }
  const cashOutConfig = configManager.getCashOut(deviceId, settings.config)
  const receipt = configManager.getReceipt(settings.config)
  const terms = configManager.getTermsConditions(settings.config)

  state.pids[deviceId] = { pid, ts: Date.now() }

  return Promise.all([pi.pollQueries(serialNumber, deviceTime, req.query, machineVersion, machineModel), triggersPromise])
    .then(([results, triggers]) => {
      const cassettes = results.cassettes

      const reboot = pid && state.reboots[deviceId] && state.reboots[deviceId] === pid
      const shutdown = pid && state.shutdowns[deviceId] && state.shutdowns[deviceId] === pid
      const restartServices = pid && state.restartServicesMap[deviceId] && state.restartServicesMap[deviceId] === pid
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
        cassettes,
        twoWayMode: cashOutConfig.active,
        zeroConfLimits,
        reboot,
        shutdown,
        restartServices,
        hasLightning,
        receipt,
        operatorInfo,
        machineInfo,
        triggers
      }

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
        response.sanctionsVerificationActive = !!compatTriggers.sancations
        response.sanctionsVerificationThreshold = compatTriggers.sancations
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
