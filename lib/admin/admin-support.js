const fs = require('fs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const morgan = require('morgan')
const express = require('express')
const app = express()
const https = require('https')
const _ = require('lodash/fp')
const serveStatic = require('serve-static')
const path = require('path')

const logs = require('../logs')
const supportLogs = require('../support_logs')
const options = require('../options')

app.use(morgan('dev'))
app.use(helmet({noCache: true}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(serveStatic(path.resolve(__dirname, '..', '..', 'public'), {
  'index': ['support-index.html']
}))

const certOptions = {
  key: fs.readFileSync(options.keyPath),
  cert: fs.readFileSync(options.certPath),
  ca: [fs.readFileSync(options.lamassuCaPath)],
  requestCert: true,
  rejectUnauthorized: true
}

app.get('/api/support_logs', (req, res, next) => {
  return supportLogs.batch()
    .then(supportLogs => res.send({ supportLogs }))
    .catch(next)
})

app.get('/api/support_logs/logs', (req, res, next) => {
  return supportLogs.get(req.query.supportLogId)
    .then(log => (!_.isNil(log) && !_.isEmpty(log)) ? log : supportLogs.batch().then(_.first))
    .then(result => {
      const log = result || {}
      return logs.getUnlimitedMachineLogs(log.deviceId, log.timestamp)
    })
    .then(r => res.send(r))
    .catch(next)
})

app.post('/api/support_logs', (req, res, next) => {
  return supportLogs.insert(req.query.deviceId)
    .then(r => res.send(r))
    .catch(next)
})

function run (port) {
  return new Promise((resolve, reject) => {
    const webServer = https.createServer(certOptions, app)
    webServer.listen(port, resolve)
  })
}

module.exports = { run }
