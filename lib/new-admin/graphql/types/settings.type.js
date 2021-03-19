const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    accounts: JSONObject
    config: JSONObject
  }

  type Mutation {
    saveAccounts(accounts: JSONObject): JSONObject
    resetAccounts(schemaVersion: Int): JSONObject
    saveConfig(config: JSONObject): JSONObject
    resetConfig(schemaVersion: Int): JSONObject
    migrateConfigAndAccounts: JSONObject
  }
`

module.exports = typeDef
