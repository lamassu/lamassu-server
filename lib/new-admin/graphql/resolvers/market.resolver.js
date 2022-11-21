const exchange = require('../../../exchange')

const resolvers = {
  Query: {
    getMarkets: () => exchange.getMarkets()
  }
}

module.exports = resolvers
