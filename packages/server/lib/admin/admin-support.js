const fs = require('fs')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const morgan = require('morgan')
const express = require('express')
const app = express()
const https = require('https')
const _ = require('lodash/fp')
const serveStatic = require('serve-static')
const path = require('path')

const KEY_PATH = process.env.KEY_PATH
const CERT_PATH = process.env.CERT_PATH
const LAMASSU_CA_PATH = process.env.LAMASSU_CA_PATH

app.use(morgan('dev'))
app.use(helmet({noCache: true}))
app.use(cookieParser())
app.use(express.json())
app.use(serveStatic(path.resolve(__dirname, '..', '..', 'public'), {
  'index': ['support-index.html']
}))

const certOptions = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
  ca: [fs.readFileSync(LAMASSU_CA_PATH)],
  requestCert: true,
  rejectUnauthorized: true
}

function run (port) {
  return new Promise((resolve, reject) => {
    const webServer = https.createServer(certOptions, app)
    webServer.listen(port, resolve)
  })
}

module.exports = { run }
