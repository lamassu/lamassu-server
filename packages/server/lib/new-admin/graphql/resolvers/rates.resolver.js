const settingsLoader = require('../../../new-settings-loader')
const forex = require('../../../forex')
const plugins = require('../../../plugins')

const resolvers = {
  Query: {
    cryptoRates: () =>
      settingsLoader.loadLatest().then(settings => {
        const pi = plugins(settings)
        return pi.getRawRates().then(r => {
          return {
            withCommissions: pi.buildRates(r),
            withoutCommissions: pi.buildRatesNoCommission(r)
          }
        })
      }),
    fiatRates: () => forex.getFiatRates()
  }
}

module.exports = resolvers
