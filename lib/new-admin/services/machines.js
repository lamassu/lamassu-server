const machineLoader = require('../../machine-loader')
const { UserInputError } = require('apollo-server-express')

function getMachine (machineId) {
  return machineLoader.getMachines()
    .then(machines => machines.find(({ deviceId }) => deviceId === machineId))
}

function machineAction ({ deviceId, action, cashUnits, newName }, context) {
  const operatorId = context.res.locals.operatorId
  return getMachine(deviceId)
    .then(machine => {
      if (!machine) throw new UserInputError(`machine:${deviceId} not found`, { deviceId })
      return machine
    })
    .then(machineLoader.setMachine({ deviceId, action, cashUnits, newName }, operatorId))
    .then(getMachine(deviceId))
}

module.exports = { machineAction }
