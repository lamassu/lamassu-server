const cashbox = require('../../../cashbox-batches')

const resolvers = {
  Query: {
    cashboxBatches: () => cashbox.getBatches()
  }
}

module.exports = resolvers
