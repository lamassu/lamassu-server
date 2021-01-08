const express = require('express')
const router = express.Router()

const plugins = require('../plugins')

function verifyTx (req, res, next) {
  const pi = plugins(req.settings, req.deviceId)
  pi.verifyTransaction(req.body)
    .then(idResult => res.status(200).json(idResult))
    .catch(next)
}

router.post('/', verifyTx)

module.exports = router