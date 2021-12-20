const bills = require('../../services/bills')

const resolvers = {
  Query: {
    bills: () => bills.getBills(),
    looseBills: () => bills.getLooseBills(),
    looseBillsByMachine: (...[, { deviceId }]) => bills.getLooseBillsByMachine(deviceId)
  }
}

module.exports = resolvers
