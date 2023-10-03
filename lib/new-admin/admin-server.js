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
const { graphqlUploadExpress } = require('graphql-upload')
const { ApolloServer } = require('apollo-server-express')

require('../environment-helper')
const { asyncLocalStorage, defaultStore } = require('../async-storage')
const logger = require('../logger')

const { AuthDirective } = require('./graphql/directives')
const { typeDefs, resolvers } = require('./graphql/schema')
const findOperatorId = require('../middlewares/operatorId')
const computeSchema = require('../compute-schema')
const { USER_SESSIONS_CLEAR_INTERVAL } = require('../constants')
const { session, cleanUserSessions, buildApolloContext } = require('./middlewares')

const devMode = require('minimist')(process.argv.slice(2)).dev

const HOSTNAME = process.env.HOSTNAME
const KEY_PATH = process.env.KEY_PATH
const CERT_PATH = process.env.CERT_PATH
const ID_PHOTO_CARD_DIR = process.env.ID_PHOTO_CARD_DIR
const FRONT_CAMERA_DIR = process.env.FRONT_CAMERA_DIR
const OPERATOR_DATA_DIR = process.env.OPERATOR_DATA_DIR

if (!HOSTNAME) {
  logger.error('No hostname specified.')
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
app.use(computeSchema)
app.use(findOperatorId)
app.use(session)
app.use(graphqlUploadExpress())

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  uploads: false,
  schemaDirectives: {
    auth: AuthDirective
  },
  playground: false,
  introspection: false,
  formatError: error => {
    const exception = error?.extensions?.exception
    logger.error(error, JSON.stringify(exception || {}))
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

app.use('/id-card-photo', serveStatic(ID_PHOTO_CARD_DIR, { index: false }))
app.use('/front-camera-photo', serveStatic(FRONT_CAMERA_DIR, { index: false }))
app.use('/operator-data', serveStatic(OPERATOR_DATA_DIR, { index: false }))

// Everything not on graphql or api/register is redirected to the front-end
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'public', 'index.html')))

const certOptions = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH)
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
