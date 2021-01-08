const express = require('express')
const router = express.Router()

const helpers = require('../route-helpers')

function stateChange (req, res, next) {
  helpers.stateChange(req.deviceId, req.deviceTime, req.body)
    .then(() => res.status(200).json({}))
    .catch(next)
}

router.post('/', stateChange)

module.exports = router