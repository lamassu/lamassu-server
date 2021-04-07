const { gql } = require('apollo-server-express')

const typeDef = gql`
  type Query {
    accounts: JSONObject @auth
    config: JSONObject @auth
  }

  type Mutation {
    saveAccounts(accounts: JSONObject): JSONObject @auth
    # resetAccounts(schemaVersion: Int): JSONObject @auth
    saveConfig(config: JSONObject): JSONObject @auth
    # resetConfig(schemaVersion: Int): JSONObject @auth
    # migrateConfigAndAccounts: JSONObject @auth
  }
`

module.exports = typeDef
