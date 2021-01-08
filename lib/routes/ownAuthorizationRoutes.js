const express = require('express')
const router = express.Router()

const ca = require('../middlewares/ca')
const pair = require('../middlewares/pair')
const populateDeviceId = require('../middlewares/populateDeviceId')

router.post('/pair', populateDeviceId, pair)
router.get('/ca', ca)

module.exports = router