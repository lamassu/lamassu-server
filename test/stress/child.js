const https = require('https')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid')

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

function request (machineIndex, pid) {
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
      process.send({ message: Buffer.from(d).toString() })
    })
  })

  counter++
}

process.on('message', (msg) => {
  console.log('Message from parent:', msg)

  const pid = uuid.v4()
  request(msg.machineIndex, pid)

  setInterval(() => {
    const pid = uuid.v4()
    request(msg.machineIndex, pid)
  }, 5000)
})
