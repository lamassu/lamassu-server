const bills = require('../../services/bills')

const resolvers = {
  Query: {
    bills: (...[, { filters }]) => bills.getBills(filters)
  }
}

module.exports = resolvers
