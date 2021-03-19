const bills = require('../../services/bills')

const resolvers = {
  Query: {
    bills: () => bills.getBills()
  }
}

module.exports = resolvers
