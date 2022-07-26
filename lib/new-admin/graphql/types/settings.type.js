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
    saveAccounts(accounts: JSONObject): JSONObject @auth(permissions: ["accounts:write"])
    saveCoinAtmRadar(config: JSONObject): JSONObject @auth(permissions: ["coinAtmRadar:write"])
    saveCompliance(config: JSONObject): JSONObject @auth(permissions: ["compliance:write"])
    saveCommissions(config: JSONObject): JSONObject @auth(permissions: ["commissions:write"])
    saveCashIn(config: JSONObject): JSONObject @auth(permissions: ["cashIn:write"])
    saveCashOut(config: JSONObject): JSONObject @auth(permissions: ["cashOut:write"])
    saveLocales(config: JSONObject): JSONObject @auth(permissions: ["locales:write"])
    saveNotifications(config: JSONObject): JSONObject @auth(permissions: ["notifications:write"])
    saveOperatorInfo(config: JSONObject): JSONObject @auth(permissions: ["operatorInfo:write"])
    saveReceipt(config: JSONObject): JSONObject @auth(permissions: ["receipt:write"])
    saveTermsAndConditions(config: JSONObject): JSONObject @auth(permissions: ["termsAndConditions:write"])
    saveTriggers(config: JSONObject): JSONObject @auth(permissions: ["triggers:write"])
    saveTriggersConfig(config: JSONObject): JSONObject @auth(permissions: ["triggersConfig:write"])
    saveWalletAdvanced(config: JSONObject): JSONObject @auth(permissions: ["advancedWallet:write"])
    saveWallets(config: JSONObject): JSONObject @auth(permissions: ["wallets:write"])
    # resetAccounts(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    # resetConfig(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    # migrateConfigAndAccounts: JSONObject @auth(permissions: ["config:write"])
  }
`

module.exports = typeDef
