const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    accounts: JSONObject @auth(permissions: ["config:read"])
    config: JSONObject @auth(permissions: ["config:read"])
  }

  type Mutation {
    saveAccounts(accounts: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCoinAtmRadar(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveConfig(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCompliance(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCommissions(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCashIn(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCashOut(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveLocales(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveNotifications(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveOperatorInfo(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveReceipt(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveTermsAndConditions(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveTriggers(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveTriggersConfig(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveWalletAdvanced(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveWallets(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    # resetAccounts(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    # resetConfig(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    # migrateConfigAndAccounts: JSONObject @auth(permissions: ["config:write"])
  }
`

module.exports = typeDef
