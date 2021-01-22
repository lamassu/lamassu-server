const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Date: GraphQLDateTime
}

module.exports = resolvers
