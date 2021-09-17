const settingsLoader = require('../../../new-settings-loader')

const resolvers = {
  Query: {
    accounts: () => settingsLoader.showAccounts(),
    config: () => settingsLoader.loadLatestConfigOrNone()
  },
  Mutation: {
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    // resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config),
    // resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    // migrateConfigAndAccounts: () => settingsLoader.migrate()
  }
}

module.exports = resolvers
