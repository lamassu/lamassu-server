const express = require('express')
const router = express.Router()
const _ = require('lodash/fp')

const complianceTriggers = require('../compliance-triggers')
const configManager = require('../new-config-manager')
const plugins = require('../plugins')
const semver = require('semver')
const state = require('../middlewares/state')
const version = require('../../package.json').version

function checkHasLightning (settings) {
  return configManager.getWalletSettings('BTC', settings.config).layer2 !== 'no-layer2'
}

function createTerms (terms) {
  if (!terms.active || !terms.text) return null

  return {
    active: terms.active,
    title: terms.title,
    text: nmd(terms.text),
    accept: terms.acceptButtonText,
    cancel: terms.cancelButtonText
  }
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
  const pi = plugins(settings, deviceId)
  const hasLightning = checkHasLightning(settings)

  const triggers = configManager.getTriggers(settings.config)

  const operatorInfo = configManager.getOperatorInfo(settings.config)
  const cashOutConfig = configManager.getCashOut(deviceId, settings.config)
  const receipt = configManager.getReceipt(settings.config)

  state.pids[deviceId] = { pid, ts: Date.now() }

  return pi.pollQueries(serialNumber, deviceTime, req.query, machineVersion, machineModel)
    .then(results => {
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
        zeroConfLimit: cashOutConfig.zeroConfLimit,
        reboot,
        shutdown,
        restartServices,
        hasLightning,
        receipt,
        operatorInfo,
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
        response.terms = config.termsScreenActive && config.termsScreenText ? createTerms(config) : null
      }

      return res.json(_.assign(response, results))
    })
    .catch(next)
}

router.get('/', poll)

module.exports = router