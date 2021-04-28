const cashbox = require('../../../cashbox-batches')

const resolvers = {
  Query: {
    cashboxBatches: () => cashbox.getBatches()
  },
  Mutation: {
    createBatch: (...[, { deviceId, cashboxCount }]) => cashbox.createCashboxBatch(deviceId, cashboxCount),
    editBatch: (...[, { id, performedBy }]) => cashbox.editBatchById(id, performedBy)
  }
}

module.exports = resolvers
