const express = require('express')
const router = express.Router()

const helpers = require('../route-helpers')
const respond = require('../respond')

function stateChange (req, res, next) {
  helpers.stateChange(req.deviceId, req.deviceTime, req.body)
    .then(() => respond(req, res))
    .catch(next)
}

router.post('/', stateChange)

module.exports = router
