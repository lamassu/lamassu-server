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

const session = require('./middlewares/session')
const { AuthDirective } = require('./graphql/directives')
const { typeDefs, resolvers } = require('./graphql/schema')
const computeSchema = require('../compute-schema')
const cleanUserSessions = require('./middlewares/cleanUserSessions')
const { USER_SESSIONS_CLEAR_INTERVAL } = require('../constants')

const devMode = require('minimist')(process.argv.slice(2)).dev
const idPhotoCardBasedir = _.get('idPhotoCardDir', options)
const frontCameraBasedir = _.get('frontCameraDir', options)

const hostname = options.hostname
if (!hostname) {
  console.error('Error: no hostname specified.')
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
app.use(computeSchema)
app.use(cleanUserSessions(USER_SESSIONS_CLEAR_INTERVAL))
app.use(session)

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    auth: AuthDirective
  },
  playground: false,
  introspection: false,
  formatError: error => {
    console.log(error)
    return error
  },
  context: async ({ req, res }) => {
    if (!req.session.user) return { req }

    const user = await users.verifyAndUpdateUser(
      req.session.user.id,
      req.headers['user-agent'] || 'Unknown',
      req.ip
    )
    if (!user || !user.enabled) throw new AuthenticationError('Authentication failed')

    req.session.ua = req.headers['user-agent'] || 'Unknown'
    req.session.ipAddress = req.ip
    req.session.lastUsed = new Date(Date.now()).toISOString()
    req.session.user.id = user.id
    req.session.user.role = user.role

    res.set('role', user.role)
    res.set('Access-Control-Expose-Headers', 'role')

    return { req }
  }
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
    webServer.listen(serverPort, () => console.log(serverLog))
  })
}

module.exports = { run }
