const { parseAsync } = require('json2csv')
const cashbox = require('../../../cashbox-batches')
const logDateFormat = require('../../../logs').logDateFormat

const resolvers = {
  Query: {
    cashboxBatches: () => cashbox.getBatches(),
    cashboxBatchesCsv: (...[, { from, until, timezone }]) => cashbox.getBatches(from, until)
      .then(data => parseAsync(logDateFormat(timezone, cashbox.logFormatter(data), ['created'])))
  },
  Mutation: {
    createBatch: (...[, { deviceId, cashboxCount }]) => cashbox.createCashboxBatch(deviceId, cashboxCount),
    editBatch: (...[, { id, performedBy }]) => cashbox.editBatchById(id, performedBy)
  }
}

module.exports = resolvers
