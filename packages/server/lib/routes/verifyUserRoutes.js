const express = require('express')
const router = express.Router()

const plugins = require('../plugins')
const respond = require('../respond')

function verifyUser (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyUser(req.body)
    .then(idResult => respond(req, res, idResult))
    .catch(next)
}

router.post('/', verifyUser)

module.exports = router
