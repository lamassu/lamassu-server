const express = require('express')
const router = express.Router()

const plugins = require('../plugins')

function verifyUser (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyUser(req.body)
    .then(idResult => res.status(200).json(idResult))
    .catch(next)
}

router.post('/', verifyUser)

module.exports = router
