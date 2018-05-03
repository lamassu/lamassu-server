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

  return !_.isEmpty(results)
}

function validateOfac (customer) {
  if (customer.sanctionsOverride === 'blocked') return false
  if (customer.sanctionsOverride === 'verified') return true

  return !matchOfac(customer)
}

function validationPatch (config, customer) {
  return Promise.resolve()
    .then(() => {
      const ofacValidation = validateOfac(customer)

      if (_.isNil(customer.sanctions) || customer.sanctions !== ofacValidation) {
        return {sanctions: ofacValidation}
      }

      return {}
    })
}

module.exports = {validationPatch}
