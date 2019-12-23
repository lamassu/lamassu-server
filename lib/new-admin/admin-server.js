const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const express = require('express')
const https = require('https')
const got = require('got')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const { ApolloServer } = require('apollo-server-express')

const T = require('../time')
const options = require('../options')

const login = require('./login')
const config = require('./config')

const { typeDefs, resolvers } = require('./graphql/schema')

const devMode = require('minimist')(process.argv.slice(2)).dev
const hostname = options.hostname
const NEVER = new Date(Date.now() + 100 * T.years)

if (!hostname) {
  console.error('Error: no hostname specified.')
  process.exit(1)
}

const app = express()

if (devMode) {
  var corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      console.log(origin)
      if (origin === 'https://localhost:8070' || origin === 'https://localhost:3000') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  }

  app.use(cors(corsOptions))
}

app.use(morgan('dev'))
app.use(helmet({ noCache: true }))
app.use(cookieParser())
app.use(bodyParser.json())
// app.use(register)
// app.use(authenticate)

const server = new ApolloServer({ typeDefs, resolvers })
server.applyMiddleware({ app, cors: false })

app.get('/api/register', (req, res, next) => {
  res.sendStatus(200)
})

function dbNotify () {
  return got.post('http://localhost:3030/dbChange')
    .catch(e => console.error('Error: lamassu-server not responding'))
}

function register (req, res, next) {
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
      next()
    })
}

function authenticate (req, res, next) {
  const token = req.token || req.cookies.token

  return login.authenticate(token)
    .then(success => {
      if (!success) return res.status(401).send('Authentication failed')
      next()
    })
}

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
