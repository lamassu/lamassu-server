const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const { ApolloServer } = require('apollo-server-express')

const { typeDefs, resolvers } = require('./graphql/schema')

const devMode = require('minimist')(process.argv.slice(2)).dev
const app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.applyMiddleware({ app })

app.use(bodyParser.json())

if (devMode) {
  app.use(cors())
}

function run () {
  const serverPort = devMode ? 8070 : 443

  const serverLog = `lamassu-admin-server listening on port ${serverPort}${server.graphqlPath}`

  app.listen(serverPort, () => console.log(serverLog))
}

module.exports = { run }
