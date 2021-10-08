const express = require('express')
const { ApolloServer } = require('apollo-server-express')

const { typeDefs, resolvers } = require('./graphql/schema')
const logger = require('../logger')

const app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.applyMiddleware({ app })

app.use(express.json())

function run () {
  const serverLog = `lamassu-admin-server listening on port ${9010}${server.graphqlPath}`

  app.listen(9010, () => logger.info(serverLog))
}

module.exports = { run }
