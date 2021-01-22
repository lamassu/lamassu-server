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

const { typeDefs, resolvers } = require('./graphql/schema')
const login = require('./modules/login')
const register = require('./routes/authentication')

const options = require('../options')

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
app.use(express.static(path.resolve(__dirname, '..', '..', 'public')))

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  playground: false,
  introspection: false,
  formatError: error => {
    console.log(error)
    return error
  },
  context: async ({ req }) => {
    const token = req.cookies && req.cookies.token

    const success = await login.authenticate(token)
    if (!success) throw new AuthenticationError('Authentication failed')
    return { req: { ...req } }
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
app.use('/', register)

// Everything not on graphql or api/register is redirected to the front-end
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'public', 'index.html')))

const certOptions = {
  key: fs.readFileSync(options.keyPath),
  cert: fs.readFileSync(options.certPath)
}

function run () {
  const serverPort = devMode ? 8070 : 443

  const serverLog = `lamassu-admin-server listening on port ${serverPort}`

  const webServer = https.createServer(certOptions, app)
  webServer.listen(serverPort, () => console.log(serverLog))
}

module.exports = { run }
