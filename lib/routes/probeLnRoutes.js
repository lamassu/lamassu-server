const express = require('express')
const router = express.Router()

const plugins = require('../plugins')
const settingsLoader = require('../new-settings-loader')

function probe (req, res, next) {
  // TODO: why req.settings is undefined?
  settingsLoader.loadLatest()
    .then(settings => {
      const pi = plugins(settings, req.deviceId)
      return pi.probeLN('LN', req.body.address)
        .then(r => res.status(200).send({ hardLimits: r }))
        .catch(next)
    })
}

router.get('/', probe)

module.exports = router