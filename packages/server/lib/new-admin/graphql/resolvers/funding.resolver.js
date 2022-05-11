const funding = require('../../services/funding')

const resolvers = {
  Query: {
    funding: () => funding.getFunding()
  }
}

module.exports = resolvers
