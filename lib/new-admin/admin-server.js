const fs = require('fs')
const express = require('express')
const https = require('https')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { ApolloServer, AuthenticationError } = require('apollo-server-express')

const T = require('../time')
const options = require('../options')

const login = require('./login')
const { typeDefs, resolvers } = require('./graphql/schema')

const devMode = require('minimist')(process.argv.slice(2)).dev
const NEVER = new Date(Date.now() + 100 * T.years)

const hostname = options.hostname
if (!hostname) {
  console.error('Error: no hostname specified.')
  process.exit(1)
}

const app = express()
app.use(helmet({ noCache: true }))
app.use(cookieParser())

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
  }
})

apolloServer.applyMiddleware({
  app,
  cors: {
    credentials: true,
    origin: devMode && 'https://localhost:3000'
  }
})

// cors on app for /api/register endpoint.
app.use(cors({ credentials: true, origin: devMode && 'https://localhost:3000' }))

app.get('/api/register', (req, res, next) => {
  const otp = req.query.otp

  if (!otp) return next()

  return login.register(otp)
    .then(r => {
      if (r.expired) return res.status(401).send('OTP expired, generate new registration link')

      // Maybe user is using old registration key, attempt to authenticate
      if (!r.success) return next()

      const cookieOpts = {
        httpOnly: true,
        secure: true,
        domain: hostname,
        sameSite: true,
        expires: NEVER
      }

      const token = r.token
      req.token = token
      res.cookie('token', token, cookieOpts)
      res.sendStatus(200)
    })
})

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
