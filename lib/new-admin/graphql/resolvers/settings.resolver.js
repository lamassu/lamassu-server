const settingsLoader = require('../../../new-settings-loader')
const configHelper = require('../../../config')

const resolvers = {
  Query: {
    accounts: () => settingsLoader.showAccounts(),
    config: () => settingsLoader.loadLatestConfigOrNone()
  },
  Mutation: {
    saveAccounts: (...[, { accounts }]) => settingsLoader.saveAccounts(accounts),
    saveCoinAtmRadar: (...[, { config }]) => settingsLoader.saveCoinAtmRadar(config),
    saveConfig: (...[, { config }]) => settingsLoader.saveConfig(config),
    saveCompliance: (...[, { config }]) => configHelper.saveCompliance(config),
    saveCommissions: (...[, { config }]) => configHelper.saveCommissions(config),
    saveCashIn: (...[, { config }]) => configHelper.saveCashIn(config),
    saveCashOut: (...[, { config }]) => configHelper.saveCashOut(config),
    saveLocales: (...[, { config }]) => configHelper.saveLocale(config),
    saveNotifications: (...[, { config }]) => configHelper.saveNotifications(config),
    saveOperatorInfo: (...[, { config }]) => configHelper.saveOperatorInfo(config),
    saveReceipt: (...[, { config }]) => configHelper.saveReceipt(config),
    saveTermsAndConditions: (...[, { config }]) => configHelper.saveTermsAndConditions(config),
    saveTriggers: (...[, { config }]) => configHelper.saveTriggers(config),
    saveTriggersConfig: (...[, { config }]) => configHelper.saveTriggersConfig(config),
    saveWalletAdvanced: (...[, { config }]) => configHelper.saveWalletAdvanced(config),
    saveWallets: (...[, { config }]) => configHelper.saveWallet(config)
    // resetAccounts: (...[, { schemaVersion }]) => settingsLoader.resetAccounts(schemaVersion),
    // resetConfig: (...[, { schemaVersion }]) => settingsLoader.resetConfig(schemaVersion),
    // migrateConfigAndAccounts: () => settingsLoader.migrate()
  }
}

module.exports = resolvers
