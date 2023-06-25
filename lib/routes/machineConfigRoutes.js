const express = require('express')
const _ = require('lodash/fp')
const router = express.Router()

const populateDeviceId = require('../middlewares/populateDeviceId')
const machineConfig = require('../machine-config')

function syncConfig (req, res, next) {
  const deviceId = req.deviceId
  const deviceConfig = req.body

  return machineConfig.getMachineConfig(deviceId)
    .then(storedConfig => {
      if (_.isNil(deviceConfig.lastModified) && _.isNil(storedConfig)) {
        // If there's no data regarding this machine, take the its device config and store it since at this point, the machine is the source of truth
        return machineConfig.storeMachineConfig(deviceId, deviceConfig)
      }

      // If the database already has a config stored for this machine, use the stored config as the database is the source of truth
      return storedConfig
    })
    .then(updatedConfig => {
      const triggerRestart = _.isNil(deviceConfig.lastModified) || !_.equals(new Date(deviceConfig.lastModified), new Date(updatedConfig.lastModified))
      updatedConfig.deviceConfig.lastModified = updatedConfig.lastModified
      return res.status(200).json({ config: updatedConfig.deviceConfig, triggerRestart })
    })
    .catch(next)
}

router.post('/sync', populateDeviceId, syncConfig)

module.exports = router
