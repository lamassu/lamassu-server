const ta = require('../../../testingAddresses')

const resolvers = {
  Query: {
    testingAddresses: () => ta.getTestingAddresses()
  },
  Mutation: {
    addTestingAddress: (...[, { cryptoCode, address }]) =>
        ta.addTestingAddress(cryptoCode, address),
    deleteTestingAddress: (...[, { cryptoCode, address }]) =>
        ta.deleteTestingAddress(cryptoCode, address)
  }
}

module.exports = resolvers
