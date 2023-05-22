const express = require('express')
const router = express.Router()

const { asyncLocalStorage, defaultStore } = require('../async-storage')
const { getOperatorFromToken } = require('../ultralight/queries')

const ca = require('../middlewares/ca')
const httpError = require('../route-helpers').httpError
const pairing = require('../pairing')
const populateDeviceId = require('../middlewares/populateDeviceId')

function pair (req, res, next) {
  const store = defaultStore()

  const token = req.query.token
  const deviceId = req.deviceId
  const model = req.query.model
  const numOfCassettes = req.query.numOfCassettes

  asyncLocalStorage.run(store, async () => {
    try {
      const { id, schema } = await getOperatorFromToken(token)
      store.set('schema', schema)
      const isValid = await pairing.pair(id, token, deviceId, model, numOfCassettes)
      if (isValid) return res.json({ status: 'paired' })
      throw httpError('Pairing failed')
    } catch (err) {
      return next(err)
    }
  })
}

router.post('/pair', populateDeviceId, pair)
router.get('/ca', ca)

module.exports = router
