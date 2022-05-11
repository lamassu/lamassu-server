const express = require('express')
const router = express.Router()

const ca = require('../middlewares/ca')
const httpError = require('../route-helpers').httpError
const pairing = require('../pairing')
const populateDeviceId = require('../middlewares/populateDeviceId')

function pair (req, res, next) {
  const token = req.query.token
  const deviceId = req.deviceId
  const model = req.query.model
  const numOfCassettes = req.query.numOfCassettes

  return pairing.pair(token, deviceId, model, numOfCassettes)
    .then(isValid => {
      if (isValid) return res.json({ status: 'paired' })
      throw httpError('Pairing failed')
    })
    .catch(next)
}

router.post('/pair', populateDeviceId, pair)
router.get('/ca', ca)

module.exports = router
