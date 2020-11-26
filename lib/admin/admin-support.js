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

function run (port) {
  return new Promise((resolve, reject) => {
    const webServer = https.createServer(certOptions, app)
    webServer.listen(port, resolve)
  })
}

module.exports = { run }
