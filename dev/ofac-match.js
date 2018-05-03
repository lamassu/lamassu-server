const compliance = require('../lib/compliance')
const ofac = require('../lib/ofac/index')

const [firstName, lastName, dateOfBirth] = process.argv.slice(2)

const customer = {
  idCardData: {firstName, lastName, dateOfBirth}
}

const config = {
  sanctionsVerificationActive: true
}

console.log('DEBUG100')
ofac.load()
  .then(() => compliance.validateCustomer(config, customer))
  .then(() => console.log('SUCCESS!'))
  .catch(err => console.log(err))
