const cashbox = require('../../../cashbox-batches')

const resolvers = {
  Query: {
    cashboxBatches: () => cashbox.getBatches()
  },
  Mutation: {
    createBatch: (...[, { deviceId }]) => cashbox.createCashboxBatch(deviceId),
    editBatch: (...[, { id, performedBy }]) => cashbox.editBatchById(id, performedBy)
  }
}

module.exports = resolvers
