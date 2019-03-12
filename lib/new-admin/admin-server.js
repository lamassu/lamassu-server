const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const got = require('got')

const supportLogs = require('../support_logs')
const machineLoader = require('../machine-loader')
const logs = require('../logs')

const funding = require('./funding')
const config = require('./config')

const devMode = require('minimist')(process.argv.slice(2)).dev

const app = express()
app.use(bodyParser.json())

if (devMode) {
  app.use(cors())
}

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

function dbNotify () {
  return got.post('http://localhost:3030/dbChange')
    .catch(e => console.error('Error: lamassu-server not responding'))
}

function run () {
  const serverPort = 8070

  const serverLog = `lamassu-admin-server listening on port ${serverPort}`

  const webServer = http.createServer(app)
  webServer.listen(serverPort, () => console.log(serverLog))
}

module.exports = { run }
