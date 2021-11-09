const { GraphQLDateTime } = require('graphql-iso-date')
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')
const { GraphQLUpload } = require('graphql-upload')
GraphQLDateTime.name = 'Date'

const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Date: GraphQLDateTime,
  UploadGQL: GraphQLUpload
}

module.exports = resolvers
