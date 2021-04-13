const express = require('express')
const router = express.Router()

function notifyCashboxRemoval (req, res, next) {
  Promise.resolve()
    .then(() => {
      console.log(`Device ${req.deviceId} had its cashbox removed.`)
      return res.status(200).send({ status: 'OK' })
    })
    .catch(next)
}

router.post('/cashboxremoval', notifyCashboxRemoval)

module.exports = router
