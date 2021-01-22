const DataLoader = require('dataloader')

const { machineAction } = require('../../modules/machines')

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
    machineAction: (...[, { deviceId, action, cashbox, cassette1, cassette2, newName }]) => machineAction({ deviceId, action, cashbox, cassette1, cassette2, newName })
  }
}

module.exports = resolvers
