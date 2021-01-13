const https = require('https')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid')
const _ = require('lodash/fp')
const { PerformanceObserver, performance } = require('perf_hooks')

const utils = require('./utils')
const variables = require('./utils/variables')

function getCert (machineIndex) {
  try {
    return {
      key: fs.readFileSync(path.resolve(__dirname, 'machines', `${machineIndex}`, 'client.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'machines', `${machineIndex}`, 'client.pem'))
    }
  } catch (e) {
    return null
  }
}

function connectionInfo (machineIndex) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, 'machines', `${machineIndex}`, 'connection_info.json')))
  } catch (e) {
    return null
  }
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
    key: getCert(machineIndex).key,
    cert: getCert(machineIndex).cert,
    ca: connectionInfo(machineIndex).ca,
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

  if (msg.hasVariance) await new Promise(resolve => setTimeout(resolve, utils.randomIntFromInterval(1, variables.POLLING_INTERVAL)))
  const pid = uuid.v4()
  request(msg.machineIndex, pid)

  setInterval(() => {
    const pid = uuid.v4()
    request(msg.machineIndex, pid)
  }, 5000)
})
