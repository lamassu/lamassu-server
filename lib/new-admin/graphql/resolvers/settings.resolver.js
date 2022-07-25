const settingsLoader = require('../../../new-settings-loader')
const configHelper = require('../../../config')

const resolvers = {
  Query: {
    accounts: () => settingsLoader.showAccounts(),
    config: () => settingsLoader.loadLatestConfigOrNone()
  },
  Mutation: {
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    // resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config),
    saveCashOut: (...[, { config }]) => configHelper.saveCashOut(config),
    // resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    // migrateConfigAndAccounts: () => settingsLoader.migrate()
  }
}

module.exports = resolvers
