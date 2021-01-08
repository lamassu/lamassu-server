const express = require('express')
const router = express.Router()

const configManager = require('../new-config-manager')
const plugins = require('../plugins')

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

function getTermsConditions (req, res, next) {
  const deviceId = req.deviceId
  const settings = req.settings

  const terms = configManager.getTermsConditions(settings.config)

  const pi = plugins(settings, deviceId)

  return pi.fetchCurrentConfigVersion().then(version => {
    return res.json({ terms: createTerms(terms), version })
  })
    .catch(next)
}

router.get('/', getTermsConditions)

module.exports = router