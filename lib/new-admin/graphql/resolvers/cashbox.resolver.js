const cashbox = require('../../../cashbox-batches')

const resolvers = {
  Query: {
    cashboxBatches: () => cashbox.getBatches()
  },
  Mutation: {
    editBatch: (...[, { id, performedBy }]) => cashbox.editBatchById(id, performedBy)
  }
}

module.exports = resolvers
