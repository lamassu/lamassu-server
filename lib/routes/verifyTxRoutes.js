const express = require('express')
const router = express.Router()

const plugins = require('../plugins')
const respond = require('../respond')

function verifyTx (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyTransaction(req.body)
    .then(idResult => respond(req, res, idResult))
    .catch(next)
}

router.post('/', verifyTx)

module.exports = router
