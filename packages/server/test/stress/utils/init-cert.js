const path = require('path')
const variables = require('./variables')
const { init } = require(`../${variables.MACHINE_PATH}/lib/pairing`)

const number = process.argv[2]

const certPath = {
  cert: path.resolve(process.cwd(), 'machines', number, 'client.pem'),
  key: path.resolve(process.cwd(), 'machines', number, 'client.key')
}

init(certPath)
