const express = require('express')
const nmd = require('nano-markdown')

const router = express.Router()

const configManager = require('../new-config-manager')
const settingsLoader = require('../new-settings-loader')

const createTerms = terms => (terms.active && terms.text) ? ({
  delay: terms.delay,
  active: terms.active,
  tcPhoto: terms.tcPhoto,
  title: terms.title,
  text: nmd(terms.text),
  accept: terms.acceptButtonText,
  cancel: terms.cancelButtonText
}) : null

function getTermsConditions (req, res, next) {
  const deviceId = req.deviceId
  const { config } = req.settings
  const terms = configManager.getTermsConditions(config)
  return settingsLoader.fetchCurrentConfigVersion()
    .then(version => res.json({ terms: createTerms(terms), version }))
    .catch(next)
}

router.get('/', getTermsConditions)

module.exports = router
