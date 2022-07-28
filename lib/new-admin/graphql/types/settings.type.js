const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    accounts: JSONObject @auth(permissions: ["accounts:read"])
    advancedWalletConfig: JSONObject @auth(permissions: ["advancedWallet:read"])
    cashInConfig: JSONObject @auth(permissions: ["cashIn:read"])
    cashOutConfig: JSONObject @auth(permissions: ["cashOut:read"])
    coinAtmRadarConfig: JSONObject @auth(permissions: ["coinAtmRadar:read"])
    commissionsConfig: JSONObject @auth(permissions: ["commissions:read"])
    complianceConfig: JSONObject @auth(permissions: ["compliance:read"])
    localesConfig: JSONObject @auth(permissions: ["locales:read"])
    notificationsConfig: JSONObject @auth(permissions: ["notifications:read"])
    operatorInfoConfig: JSONObject @auth(permissions: ["operatorInfo:read"])
    receiptConfig: JSONObject @auth(permissions: ["receipt:read"])
    termsAndConditionsConfig: JSONObject @auth(permissions: ["termsAndConditions:read"])
    triggers: JSONObject @auth(permissions: ["triggers:read"])
    triggersConfig: JSONObject @auth(permissions: ["triggersConfig:read"])
    walletConfig: JSONObject @auth(permissions: ["wallets:read"])
  }

  type Mutation {
    saveAccounts(accounts: JSONObject): JSONObject @auth(permissions: ["accounts:update"])
    saveCoinAtmRadar(config: JSONObject): JSONObject @auth(permissions: ["coinAtmRadar:update"])
    saveCompliance(config: JSONObject): JSONObject @auth(permissions: ["compliance:update"])
    saveCommissions(config: JSONObject): JSONObject @auth(permissions: ["commissions:update"])
    saveCashIn(config: JSONObject): JSONObject @auth(permissions: ["cashIn:update"])
    saveCashOut(config: JSONObject): JSONObject @auth(permissions: ["cashOut:update"])
    saveLocales(config: JSONObject): JSONObject @auth(permissions: ["locales:update"])
    saveNotifications(config: JSONObject): JSONObject @auth(permissions: ["notifications:update"])
    saveOperatorInfo(config: JSONObject): JSONObject @auth(permissions: ["operatorInfo:update"])
    saveReceipt(config: JSONObject): JSONObject @auth(permissions: ["receipt:update"])
    saveTermsAndConditions(config: JSONObject): JSONObject @auth(permissions: ["termsAndConditions:update"])
    saveTriggers(config: JSONObject): JSONObject @auth(permissions: ["triggers:update"])
    saveTriggersConfig(config: JSONObject): JSONObject @auth(permissions: ["triggersConfig:update"])
    saveWalletAdvanced(config: JSONObject): JSONObject @auth(permissions: ["advancedWallet:update"])
    saveWallets(config: JSONObject): JSONObject @auth(permissions: ["wallets:update"])
    # resetAccounts(schemaVersion: Int): JSONObject @auth(permissions: ["config:update"])
    # resetConfig(schemaVersion: Int): JSONObject @auth(permissions: ["config:update"])
    # migrateConfigAndAccounts: JSONObject @auth(permissions: ["config:update"])
  }
`

module.exports = typeDef
