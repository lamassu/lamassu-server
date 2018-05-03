const _ = require('lodash/fp')

const logger = require('./logger')
const ofac = require('./ofac/index')

function matchOfac (customer) {
  // Probably because we haven't asked for ID yet
  if (!_.isPlainObject(customer.idCardData)) {
    return true
  }

  const nameParts = {
    firstName: customer.idCardData.firstName,
    lastName: customer.idCardData.lastName
  }

  if (_.some(_.isNil, _.values(nameParts))) {
    logger.error(new Error(`Insufficient idCardData while matching OFAC for: ${customer.id}`))
    return true
  }

  const birthDate = customer.idCardData.dateOfBirth

  if (_.isNil(birthDate)) {
    logger.error(new Error(`No birth date while matching OFAC for: ${customer.id}`))
    return true
  }

  const options = {
    threshold: 0.85,
    fullNameThreshold: 0.95,
    debug: false
  }

  const results = ofac.match(nameParts, birthDate, options)
  console.log('DEBUG200: %j', results)

  return !_.isEmpty(results)
}

function validateOfac (customer) {
  if (customer.sanctionsOverride === 'blocked') return false
  if (customer.sanctionsOverride === 'verified') return true

  console.log('DEBUG400')
  return !matchOfac(customer)
}

function validationPatch (config, customer) {
  return Promise.resolve()
    .then(() => {
      const ofacValidation = validateOfac(customer)

      console.log('DEBUG401: %s, %j', ofacValidation, customer)

      if (_.isNil(customer.sanctions) || customer.sanctions !== ofacValidation) {
        return {sanctions: ofacValidation}
      }

      return {}
    })
}

module.exports = {validationPatch}
