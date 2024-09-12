const settingsLoader = require('../../../new-settings-loader')

const resolvers = {
  Query: {
    accounts: () => settingsLoader.showAccounts(),
    config: () => settingsLoader.loadLatestConfigOrNone()
  },
  Mutation: {
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config),
  }
}

module.exports = resolvers
