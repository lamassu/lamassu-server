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
    unpairedMachines: () => machineLoader.getUnpairedMachines(),
    getMachinesUpdateStatus: () => machineLoader.getMachinesUpdateStatus(),
    getUpdateStatuses: (...[, { deviceId }]) => machineLoader.getUpdateStatuses(deviceId),
    getAvailableUpdates: () => machineLoader.getAvailableUpdates()
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cashbox, cassette1, cassette2, cassette3, cassette4, newName }, context]) =>
      machineAction({ deviceId, action, cashbox, cassette1, cassette2, cassette3, cassette4, newName }, context),
    requestUpdate: (...[, { deviceId, event, note }]) => machineLoader.recordUpdateEvent(deviceId, event, note)
  }
}

module.exports = resolvers
