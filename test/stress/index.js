
const { fork } = require('child_process')
const minimist = require('minimist')

const cmd = require('./scripts')
const variables = require('./utils/variables')

async function createMachines (numberOfMachines) {
  await cmd.execCommand(
    `bash ./scripts/create-machines.sh ${numberOfMachines} ${variables.SERVER_CERT_PATH} ${variables.MACHINE_PATH}`
  )
}

async function run (args = minimist(process.argv.slice(2))) {
  const NUMBER_OF_MACHINES = args._[0]
  const HAS_VARIANCE = args.v || false

  await createMachines(NUMBER_OF_MACHINES)

  for (let i = 1; i <= NUMBER_OF_MACHINES; i++) {
    const forked = fork('child.js')
    forked.send({ machineIndex: i, hasVariance: HAS_VARIANCE })
    forked.on('message', msg => {
      console.log(`Message from child ${i}: ${msg}`)
    })
  }
}

run()
