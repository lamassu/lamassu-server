const _ = require('lodash/fp')
const uuid = require('uuid')

const logger = require('./logger')
const db = require('./db')
const ofac = require('./ofac/index')

function logSanctionsMatch (deviceId, customer, sanctionsId, alias) {
  const sql = `insert into sanctions_logs
  (id, device_id, sanctioned_id, sanctioned_alias_id, sanctioned_alias_full_name, customer_id)
  values
  ($1, $2, $3, $4, $5, $6)`

  return db.none(sql, [uuid.v4(), deviceId, sanctionsId, alias.id, alias.fullName, customer.id])
}

function logSanctionsMatches (deviceId, customer, results) {
  const logAlias = resultId => alias => logSanctionsMatch(deviceId, customer, resultId, alias)
  const logResult = result => _.map(logAlias(result.id), result.aliases)

  return Promise.all(_.flatMap(logResult, results))
}

function matchOfac (deviceId, customer) {
  return Promise.resolve()
    .then(() => {
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

      return logSanctionsMatches(deviceId, customer, results)
        .then(() => !_.isEmpty(results))
    })
}

function validateOfac (deviceId, config, customer) {
  if (!config.sanctionsVerificationActive) return Promise.resolve(true)
  if (customer.sanctionsOverride === 'blocked') return Promise.resolve(false)
  if (customer.sanctionsOverride === 'verified') return Promise.resolve(true)

  return matchOfac(deviceId, customer)
    .then(didMatch => !didMatch)
}

function validationPatch (deviceId, config, customer) {
  return validateOfac(deviceId, config, customer)
    .then(ofacValidation => {
      if (_.isNil(customer.sanctions) || customer.sanctions !== ofacValidation) {
        return {sanctions: ofacValidation}
      }

      return {}
    })
}

module.exports = {validationPatch}
