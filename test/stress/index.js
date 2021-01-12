const https = require('https')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid')
const cmd = require('./scripts')
const variables = require('./utils/variables')

async function createMachines () {
  await cmd.execCommand(
    `bash ./scripts/create-machines.sh ${variables.NUMBER_OF_MACHINES} ${variables.SERVER_CERT_PATH} ${variables.MACHINE_PATH}`
  )
}

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
  console.log(machineIndex)
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, 'machines', `${machineIndex}`, 'connection_info.json')))
  } catch (e) {
    return null
  }
}

let index = 0

function request (machineIndex, pid) {
  https.get({
    hostname: 'localhost',
    port: 3000,
    path: '/poll?state=chooseCoin&model=unknown&version=7.5.0-beta.0&idle=true&pid=' + pid + '&sn=' + index,
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
      console.log(Buffer.from(d).toString())
    })
  })

  index++
}

function run () {
  createMachines().then(() => {
    for (let i = 1; i <= variables.NUMBER_OF_MACHINES; i++) {
      const pid = uuid.v4()
      request(i, pid)
      setInterval(() => request(i, pid), 5000)
    }
  })
}

run()
