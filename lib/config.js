const _ = require('lodash/fp')

const {
  pickAdvanced,
  pickWallet,
  pickOperatorInfo,
  pickNotifications,
  pickLocale,
  pickCommissions,
  pickReceipt,
  pickCoinAtmRadar,
  pickTermsConditions,
  pickGlobalCashIn,
  pickGlobalCashOut,
  pickCompliance
} = require('./new-config-manager')
const { saveConfig } = require('./new-settings-loader')

// Pick only the fields from the correct namespace to avoid tampering with fields from another namespace without the required permissions to do so
const saveAdvanced = _.flow(pickAdvanced, saveConfig)
const saveWallet = _.flow(pickWallet, saveConfig)
const saveOperatorInfo = _.flow(pickOperatorInfo, saveConfig)
const saveNotifications = _.flow(pickNotifications, saveConfig)
const saveLocale = _.flow(pickLocale, saveConfig)
const saveCommissions = _.flow(pickCommissions, saveConfig)
const saveReceipt = _.flow(pickReceipt, saveConfig)
const saveCoinAtmRadar = _.flow(pickCoinAtmRadar, saveConfig)
const saveTermsConditions = _.flow(pickTermsConditions, saveConfig)
const saveCashOut = _.flow(pickGlobalCashOut, saveConfig)
const saveCashIn = _.flow(pickGlobalCashIn, saveConfig)
const saveCompliance = _.flow(pickCompliance, saveConfig)

module.exports = {
  saveAdvanced,
  saveWallet,
  saveOperatorInfo,
  saveNotifications,
  saveLocale,
  saveCommissions,
  saveReceipt,
  saveCoinAtmRadar,
  saveTermsConditions,
  saveCashOut,
  saveCashIn,
  saveCompliance
}
