
const { fork } = require('child_process')
const cmd = require('./scripts')
const variables = require('./utils/variables')

async function createMachines () {
  await cmd.execCommand(
    `bash ./scripts/create-machines.sh ${variables.NUMBER_OF_MACHINES} ${variables.SERVER_CERT_PATH} ${variables.MACHINE_PATH}`
  )
}

async function run () {
  await createMachines()

  for (let i = 1; i <= variables.NUMBER_OF_MACHINES; i++) {
    const forked = fork('child.js')
    forked.send({ machineIndex: i })
    forked.on('message', msg => {
      console.log(`Message from child ${i}: ${msg}`)
    })
  }
}

run()
