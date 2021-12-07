const { gql } = require('apollo-server-express')

const typeDef = gql`
  scalar JSON
  scalar JSONObject
  scalar Date
  scalar UploadGQL
`

module.exports = typeDef
