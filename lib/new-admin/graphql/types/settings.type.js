const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    accounts: JSONObject @auth(permissions: ["config:read"])
    config: JSONObject @auth(permissions: ["config:read"])
  }

  type Mutation {
    saveAccounts(accounts: JSONObject): JSONObject @auth(permissions: ["config:write"])
    # resetAccounts(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    saveConfig(config: JSONObject): JSONObject @auth(permissions: ["config:write"])
    saveCashOut(config: JSONObject): JSONObject @auth(permissions: ["cashOut:write"])
    # resetConfig(schemaVersion: Int): JSONObject @auth(permissions: ["config:write"])
    # migrateConfigAndAccounts: JSONObject @auth(permissions: ["config:write"])
  }
`

module.exports = typeDef
