const { gql } = require('apollo-server-express')

const typeDef = gql`
  scalar JSON
  scalar JSONObject
  scalar Date
`

module.exports = typeDef
