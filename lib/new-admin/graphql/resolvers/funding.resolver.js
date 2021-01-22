const funding = require('../../modules/funding')

const resolvers = {
  Query: {
    funding: () => funding.getFunding()
  }
}

module.exports = resolvers
