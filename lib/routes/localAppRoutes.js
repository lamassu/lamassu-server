const express = require('express')
const router = express.Router()

const logger = require('../logger')
const newSettingsLoader = require('../new-settings-loader')
const poller = require('../poller')
const settingsCache = require('../middlewares/settingsCache')
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

router.post('/dbChange', (req, res, next) => {
  settingsCache.clearCache()
  return newSettingsLoader.loadLatest()
    .then(poller.reload)
    .then(() => logger.info('Config reloaded'))
    .catch(err => {
      logger.error(err)
      res.sendStatus(500)
    })
})

module.exports = router