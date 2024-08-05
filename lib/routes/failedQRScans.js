const express = require('express')
const router = express.Router()

const { updateFailedQRScans } = require('../machine-loader')

function failedQRScans (req, res, next) {
  return updateFailedQRScans(req.deviceId, req.body)
    .then(() => res.status(200).send({ status: 'OK' }))
    .catch(next)
}

router.post('/', failedQRScans)

module.exports = router
