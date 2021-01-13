const express = require('express')
const router = express.Router()

const state = require('../middlewares/state')

router.get('/pid', (req, res) => {
  const deviceId = req.query.device_id
  const pidRec = state.pids[deviceId]
  res.json(pidRec)
})

router.post('/reboot', (req, res) => {
  const deviceId = req.query.device_id
  const pid = state.pids[deviceId] && state.pids[deviceId].pid

  if (!deviceId || !pid) {
    return res.sendStatus(400)
  }

  state.reboots[deviceId] = pid
  res.sendStatus(200)
})

router.post('/shutdown', (req, res) => {
  const deviceId = req.query.device_id
  const pid = state.pids[deviceId] && state.pids[deviceId].pid

  if (!deviceId || !pid) {
    return res.sendStatus(400)
  }

  state.shutdowns[deviceId] = pid
  res.sendStatus(200)
})

router.post('/restartServices', (req, res) => {
  const deviceId = req.query.device_id
  const pid = state.pids[deviceId] && state.pids[deviceId].pid

  if (!deviceId || !pid) {
    return res.sendStatus(400)
  }

  state.restartServicesMap[deviceId] = pid
  res.sendStatus(200)
})

module.exports = router
