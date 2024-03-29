const machineLoader = require('../../machine-loader')
const { UserInputError } = require('apollo-server-express')

function getMachine (machineId) {
  return machineLoader.getMachines()
    .then(machines => machines.find(({ deviceId }) => deviceId === machineId))
}

function machineAction ({ deviceId, action, cashbox, cassette1, cassette2, cassette3, cassette4, newName }, context) {
  const operatorId = context.res.locals.operatorId
  return getMachine(deviceId)
    .then(machine => {
      if (!machine) throw new UserInputError(`machine:${deviceId} not found`, { deviceId })
      return machine
    })
    .then(machineLoader.setMachine({ deviceId, action, cashbox, cassettes: [cassette1, cassette2, cassette3, cassette4], newName }, operatorId))
    .then(getMachine(deviceId))
}

module.exports = { machineAction }
