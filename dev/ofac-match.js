const compliance = require('../lib/compliance')
const ofac = require('../lib/ofac/index')

const [customerId, firstName, lastName, dateOfBirth] = process.argv.slice(2)

const customer = {
  id: customerId,
  idCardData: {firstName, lastName, dateOfBirth}
}

const config = {
  sanctionsVerificationActive: true
}

const deviceId = 'test-device'

ofac.load()
  .then(() => compliance.validationPatch(deviceId, config, customer))
  .then(console.log)
  .catch(err => console.log(err))
