const express = require('express')
const router = express.Router()

const { updateDiagnostics } = require('../machine-loader')

function diagnostics (req, res, next) {
  return updateDiagnostics(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

router.post('/', diagnostics)

module.exports = router
