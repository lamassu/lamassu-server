const _ = require('lodash/fp')
const { CONFIG_NAMESPACES } = require('./constants')

const {
  pickAdvanced,
  pickWallet,
  pickOperatorInfo,
  pickNotifications,
  pickLocale,
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
const { saveConfig } = require('./new-settings-loader')

// Pick only the fields from the correct namespace to avoid tampering with fields from another namespace without the required permissions to do so
const saveWalletAdvanced = _.flow(pickAdvanced(CONFIG_NAMESPACES.WALLETS), saveConfig)
const saveWallet = _.flow(pickWallet, saveConfig)
const saveOperatorInfo = _.flow(pickOperatorInfo, saveConfig)
const saveNotifications = _.flow(pickNotifications, saveConfig)
const saveLocale = _.flow(pickLocale, saveConfig)
const saveCommissions = _.flow(pickCommissions, saveConfig)
const saveReceipt = _.flow(pickReceipt, saveConfig)
const saveCoinAtmRadar = _.flow(pickCoinAtmRadar, saveConfig)
const saveTermsAndConditions = _.flow(pickTermsAndConditions, saveConfig)
const saveCashOut = _.flow(pickGlobalCashOut, saveConfig)
const saveCashIn = _.flow(pickGlobalCashIn, saveConfig)
const saveCompliance = _.flow(pickCompliance, saveConfig)
const saveTriggers = _.flow(pickTriggers, saveConfig)
const saveTriggersConfig = _.flow(pickTriggersConfig, saveConfig)

module.exports = {
  saveWalletAdvanced,
  saveWallet,
  saveOperatorInfo,
  saveNotifications,
  saveLocale,
  saveCommissions,
  saveReceipt,
  saveCoinAtmRadar,
  saveTermsAndConditions,
  saveCashOut,
  saveCashIn,
  saveCompliance,
  saveTriggers,
  saveTriggersConfig
}
