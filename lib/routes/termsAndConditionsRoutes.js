const express = require('express')
const nmd = require('nano-markdown')

const router = express.Router()

const configManager = require('../new-config-manager')
const plugins = require('../plugins')

const createTerms = terms => (terms.active && terms.text) ? ({
  delay: terms.delay,
  active: terms.active,
  title: terms.title,
  text: nmd(terms.text),
  accept: terms.acceptButtonText,
  cancel: terms.cancelButtonText
}) : null

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
