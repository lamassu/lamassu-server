const fs = require('fs')
const compression = require('compression')
const path = require('path')
const express = require('express')
const https = require('https')
const serveStatic = require('serve-static')
const cors = require('cors')
const helmet = require('helmet')
const nocache = require('nocache')
const cookieParser = require('cookie-parser')
const { ApolloServer, AuthenticationError } = require('apollo-server-express')
const _ = require('lodash/fp')

const { asyncLocalStorage, defaultStore } = require('../async-storage')
const options = require('../options')
const users = require('../users')
const logger = require('../logger')

const { AuthDirective } = require('./graphql/directives')
const { typeDefs, resolvers } = require('./graphql/schema')
const computeSchema = require('../compute-schema')
const { USER_SESSIONS_CLEAR_INTERVAL } = require('../constants')
const { session, cleanUserSessions, buildApolloContext } = require('./middlewares')

const devMode = require('minimist')(process.argv.slice(2)).dev
const idPhotoCardBasedir = _.get('idPhotoCardDir', options)
const frontCameraBasedir = _.get('frontCameraDir', options)
const operatorDataBasedir = _.get('operatorDataDir', options)

const hostname = options.hostname
if (!hostname) {
  logger.error('no hostname specified.')
  process.exit(1)
}

const app = express()

app.use(helmet())
app.use(compression())
app.use(nocache())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // support encoded bodies
app.use(express.static(path.resolve(__dirname, '..', '..', 'public')))
app.use(cleanUserSessions(USER_SESSIONS_CLEAR_INTERVAL))
app.use(session)
app.use(computeSchema)

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    auth: AuthDirective
  },
  playground: false,
  introspection: false,
  formatError: error => {
    logger.error(error)
    return error
  },
  context: async (obj) => buildApolloContext(obj)
})

apolloServer.applyMiddleware({
  app,
  cors: {
    credentials: true,
    origin: devMode && 'https://localhost:3001'
  }
})

// cors on app for /api/register endpoint.
app.use(cors({ credentials: true, origin: devMode && 'https://localhost:3001' }))

app.use('/id-card-photo', serveStatic(idPhotoCardBasedir, { index: false }))
app.use('/front-camera-photo', serveStatic(frontCameraBasedir, { index: false }))
app.use('/operator-data', serveStatic(operatorDataBasedir, { index: false }))

// Everything not on graphql or api/register is redirected to the front-end
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'public', 'index.html')))

const certOptions = {
  key: fs.readFileSync(options.keyPath),
  cert: fs.readFileSync(options.certPath)
}

function run () {
  const store = defaultStore()
  asyncLocalStorage.run(store, () => {
    const serverPort = devMode ? 8070 : 443

    const serverLog = `lamassu-admin-server listening on port ${serverPort}`

    const webServer = https.createServer(certOptions, app)
    webServer.listen(serverPort, () => logger.info(serverLog))
  })
}

module.exports = { run }
