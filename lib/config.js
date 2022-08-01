const _ = require('lodash/fp')
const { CONFIG_NAMESPACES } = require('./constants')

const {
  pickAdvanced,
  pickWallets,
  pickOperatorInfo,
  pickNotifications,
  pickLocales,
  pickCommissions,
  pickReceipt,
  pickCoinAtmRadar,
  pickTermsAndConditions,
  pickGlobalCashIn,
  pickGlobalCashOut,
  pickCompliance,
  pickTriggers,
  pickTriggersConfig
} = require('./new-config-manager')
const { saveConfig, loadLatestConfigOrNone } = require('./new-settings-loader')

// Pick only the fields from the correct namespace to avoid tampering with fields from another namespace without the required permissions to do so
const saveAdvancedWallet = _.flow(pickAdvanced(CONFIG_NAMESPACES.WALLETS), saveConfig)
const saveWallets = _.flow(pickWallets, saveConfig)
const saveOperatorInfo = _.flow(pickOperatorInfo, saveConfig)
const saveNotifications = _.flow(pickNotifications, saveConfig)
const saveLocales = _.flow(pickLocales, saveConfig)
const saveCommissions = _.flow(pickCommissions, saveConfig)
const saveReceipt = _.flow(pickReceipt, saveConfig)
const saveCoinAtmRadar = _.flow(pickCoinAtmRadar, saveConfig)
const saveTermsAndConditions = _.flow(pickTermsAndConditions, saveConfig)
const saveCashOut = _.flow(pickGlobalCashOut, saveConfig)
const saveCashIn = _.flow(pickGlobalCashIn, saveConfig)
const saveCompliance = _.flow(pickCompliance, saveConfig)
const saveTriggers = _.flow(pickTriggers, saveConfig)
const saveTriggersConfig = _.flow(pickTriggersConfig, saveConfig)

const loadAdvancedWallet = () => loadLatestConfigOrNone().then(pickAdvanced(CONFIG_NAMESPACES.WALLETS))
const loadWallet = () => loadLatestConfigOrNone().then(pickWallet)
const loadOperatorInfo = () => loadLatestConfigOrNone().then(pickOperatorInfo)
const loadNotifications = () => loadLatestConfigOrNone().then(pickNotifications)
const loadLocales = () => loadLatestConfigOrNone().then(pickLocales)
const loadCommissions = () => loadLatestConfigOrNone().then(pickCommissions)
const loadReceipt = () => loadLatestConfigOrNone().then(pickReceipt)
const loadCoinAtmRadar = () => loadLatestConfigOrNone().then(pickCoinAtmRadar)
const loadTermsAndConditions = () => loadLatestConfigOrNone().then(pickTermsAndConditions)
const loadCashOut = () => loadLatestConfigOrNone().then(pickGlobalCashOut)
const loadCashIn = () => loadLatestConfigOrNone().then(pickGlobalCashIn)
const loadCompliance = () => loadLatestConfigOrNone().then(pickCompliance)
const loadTriggers = () => loadLatestConfigOrNone().then(pickTriggers)
const loadTriggersConfig = () => loadLatestConfigOrNone().then(pickTriggersConfig)

module.exports = {
  saveAdvancedWallet,
  saveWallets,
  saveOperatorInfo,
  saveNotifications,
  saveLocales,
  saveCommissions,
  saveReceipt,
  saveCoinAtmRadar,
  saveTermsAndConditions,
  saveCashOut,
  saveCashIn,
  saveCompliance,
  saveTriggers,
  saveTriggersConfig,
  loadAdvancedWallet,
  loadWallet,
  loadOperatorInfo,
  loadNotifications,
  loadLocales,
  loadCommissions,
  loadReceipt,
  loadCoinAtmRadar,
  loadTermsAndConditions,
  loadCashOut,
  loadCashIn,
  loadCompliance,
  loadTriggers,
  loadTriggersConfig
}
