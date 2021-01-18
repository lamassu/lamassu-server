const https = require('https')
const path = require('path')
const pify = require('pify')
const fs = pify(require('fs'))
const uuid = require('uuid')
const _ = require('lodash/fp')
const { PerformanceObserver, performance } = require('perf_hooks')

const utils = require('./utils')
const variables = require('./utils/variables')

var certificate = {}
var connectionInfo = {}

async function getCert (machineIndex) {
  const key = fs.readFile(path.resolve(__dirname, 'machines', `${machineIndex}`, 'client.key'))
  const cert = fs.readFile(path.resolve(__dirname, 'machines', `${machineIndex}`, 'client.pem'))

  return Promise.all([key, cert]).then(values => {
    return { key: values[0], cert: values[1] }
  }).catch(err => {
    console.err('The following error when reading the certificate: ', err)
    return null
  })
}

async function getConnectionInfo (machineIndex) {
  return fs.readFile(path.resolve(__dirname, 'machines', `${machineIndex}`, 'connection_info.json'))
}

let counter = 0
const requestTimes = []
let latestResponseTime = 0

function request (machineIndex, pid) {
  performance.mark('A')
  https.get({
    hostname: 'localhost',
    port: 3000,
    path: '/poll?state=chooseCoin&model=unknown&version=7.5.0-beta.0&idle=true&pid=' + pid + '&sn=' + counter,
    method: 'GET',
    key: certificate.key,
    cert: certificate.cert,
    ca: connectionInfo.ca,
    headers: {
      date: new Date().toISOString(),
      'request-id': uuid.v4()
    }
  }, res => {
    res.on('data', (d) => {
      performance.mark('B')
      performance.measure('A to B', 'A', 'B')
      console.log(`Machine ${machineIndex} || Avg request response time: ${_.mean(requestTimes).toFixed(3)} || Latest response time: ${latestResponseTime.toFixed(3)}`)
      process.send({ message: Buffer.from(d).toString() })
    })
  })

  counter++
}

const obs = new PerformanceObserver((items) => {
  latestResponseTime = items.getEntries()[0].duration
  requestTimes.push(latestResponseTime)
  performance.clearMarks()
})
obs.observe({ entryTypes: ['measure'] })

process.on('message', async (msg) => {
  console.log('Message from parent:', msg)

  const promises = [getCert(msg.machineIndex), getConnectionInfo(msg.machineIndex)]
  Promise.all(promises).then(values => {
    certificate = values[0]
    connectionInfo = JSON.parse(values[1])
  }).catch(err => {
    console.err('The following error occurred during certificate parsing: ', err)
  })

  if (msg.hasVariance) await new Promise(resolve => setTimeout(resolve, utils.randomIntFromInterval(1, variables.POLLING_INTERVAL)))
  const pid = uuid.v4()
  request(msg.machineIndex, pid)

  setInterval(() => {
    const pid = uuid.v4()
    request(msg.machineIndex, pid)
  }, 5000)
})
