const { coins, currencies } = require('../../config')

const resolver = {
  Query: {
    currencies: () => currencies,
    cryptoCurrencies: () => coins
  }
}

module.exports = resolver
