const got = require('got')

const settingsLoader = require('../../../new-settings-loader')

const notify = () => got.post('http://localhost:3030/dbChange')
  .catch(e => console.error('Error: lamassu-server not responding'))

const resolvers = {
  Query: {
    accounts: () => settingsLoader.loadAccounts(),
    config: () => settingsLoader.loadLatestConfigOrNone()
  },
  Mutation: {
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config).then(it => {
      notify()
      return it
    }),
    resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    migrateConfigAndAccounts: () => settingsLoader.migrate()
  }
}

module.exports = resolvers
