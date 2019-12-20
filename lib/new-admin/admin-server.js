const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const express = require('express')
const https = require('https')
const got = require('got')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')

const T = require('../time')
const supportLogs = require('../support_logs')
const machineLoader = require('../machine-loader')
const logs = require('../logs')
const options = require('../options')

const transactions = require('./transactions')
const login = require('./login')
const serverLogs = require('./server-logs')
const supervisor = require('./supervisor')
const funding = require('./funding')
const config = require('./config')

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
      if (origin === 'https://localhost:3000') {
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
app.use(register)
app.use(authenticate)

app.get('/api/config', async (req, res, next) => {
  const state = config.getConfig(req.params.config)
  const data = await config.fetchData()
  res.json({ state, data })
  next()
})

app.post('/api/config', (req, res, next) => {
  config.saveConfig(req.body)
    .then(it => res.json(it))
    .then(() => dbNotify())
    .catch(next)
})

app.get('/api/funding', (req, res) => {
  return funding.getFunding()
    .then(r => res.json(r))
})

app.get('/api/machines', (req, res) => {
  machineLoader.getMachineNames()
    .then(r => res.send({ machines: r }))
})

app.get('/api/logs/:deviceId', (req, res, next) => {
  return logs.getMachineLogs(req.params.deviceId)
    .then(r => res.send(r))
    .catch(next)
})

app.post('/api/support_logs', (req, res, next) => {
  return supportLogs.insert(req.query.deviceId)
    .then(r => res.send(r))
    .catch(next)
})

app.get('/api/version', (req, res, next) => {
  res.send(require('../../package.json').version)
})

app.get('/api/uptimes', (req, res, next) => {
  return supervisor.getAllProcessInfo()
    .then(r => res.send(r))
    .catch(next)
})

app.post('/api/server_support_logs', (req, res, next) => {
  return serverLogs.insert()
    .then(r => res.send(r))
    .catch(next)
})

app.get('/api/server_logs', (req, res, next) => {
  return serverLogs.getServerLogs()
    .then(r => res.send(r))
    .catch(next)
})

app.get('/api/txs', (req, res, next) => {
  return transactions.batch()
    .then(r => res.send(r))
    .catch(next)
})

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
