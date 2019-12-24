const bodyParser = require('body-parser')
const express = require('express')
const { ApolloServer } = require('apollo-server-express')

const { typeDefs, resolvers } = require('./graphql/schema')

const app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.applyMiddleware({ app })

app.use(bodyParser.json())

function run () {
  const serverLog = `lamassu-admin-server listening on port ${8080}${server.graphqlPath}`

  app.listen(8080, () => console.log(serverLog))
}

module.exports = { run }
