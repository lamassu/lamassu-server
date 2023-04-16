const DataLoader = require('dataloader')

const { machineAction } = require('../../services/machines')

const machineLoader = require('../../../machine-loader')
const machineEventsByIdBatch = require('../../../postgresql_interface').machineEventsByIdBatch

const machineEventsLoader = new DataLoader(ids => {
  return machineEventsByIdBatch(ids)
}, { cache: false })

const resolvers = {
  Machine: {
    latestEvent: parent => machineEventsLoader.load(parent.deviceId)
  },
  Query: {
    machines: () => machineLoader.getMachineNames(),
    machine: (...[, { deviceId }]) => machineLoader.getMachine(deviceId),
    unpairedMachines: () => machineLoader.getUnpairedMachines()
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cashUnits, newName }, context]) =>
      machineAction({ deviceId, action, cashUnits, newName }, context)
  }
}

module.exports = resolvers
