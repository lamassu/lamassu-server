const _ = require('lodash/fp')

const ofac = require('./ofac/index')

function matchOfac (customer) {
  const nameParts = _.flatMap(_.split(/\s+/), [customer.firstName, customer.lastName])
  const birthDate = customer.dateOfBirth

  const result = ofac.match(nameParts, birthDate)
  console.log('DEBUG200: %s', result)

  if (result > 0.8) throw new Error('Compliance error')
}

function validateCustomer (config, customer) {
  if (config.sanctionsVerificationActive) {
    matchOfac(customer)
  }

  return customer
}

module.exports = {validateCustomer}
