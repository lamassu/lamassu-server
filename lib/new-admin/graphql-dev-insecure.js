const express = require('express')
const path = require('path')
const { ApolloServer } = require('apollo-server-express')

require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? path.resolve(os.homedir(), '.lamassu', '.env') : path.resolve(__dirname, '../.env') })

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
