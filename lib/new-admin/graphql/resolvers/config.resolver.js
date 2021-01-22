const { accounts: accountsConfig, countries, languages } = require('../../config')

const resolver = {
  Query: {
    countries: () => countries,
    languages: () => languages,
    accountsConfig: () => accountsConfig
  }
}

module.exports = resolver
