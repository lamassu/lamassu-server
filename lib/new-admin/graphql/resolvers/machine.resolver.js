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
    machine: (...[, { deviceId }]) => machineLoader.getMachine(deviceId)
  },
  Mutation: {
    machineAction: (...[, { deviceId, action, cashbox, cassette1, cassette2, newName }, context]) => machineAction({ deviceId, action, cashbox, cassette1, cassette2, newName }, context)
  }
}

module.exports = resolvers
