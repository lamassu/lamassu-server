const _ = require('lodash/fp')
const ofac = require('./ofac')
const T = require('./time')
const logger = require('./logger')
const customers = require('./customers')

const sanctionStatus = {
  loaded: false,
  timestamp: null
}

const loadOrUpdateSanctions = () => {
  if (!sanctionStatus.loaded || (sanctionStatus.timestamp && Date.now() > sanctionStatus.timestamp + T.day)) {
    logger.info('No sanction lists loaded. Loading sanctions...')
    return ofac.load()
      .then(() => {
        logger.info('OFAC sanction list loaded!')
        sanctionStatus.loaded = true
        sanctionStatus.timestamp = Date.now()
      })
      .catch(e => {
        logger.error('Couldn\'t load OFAC sanction list!')
      })
  }

  return Promise.resolve()
}

const checkByUser = (customerId, userToken) => {
  return Promise.all([loadOrUpdateSanctions(), customers.getCustomerById(customerId)])
    .then(([, customer]) => {
      const { firstName, lastName, dateOfBirth } = customer?.idCardData
      const birthdate = _.replace(/-/g, '')(dateOfBirth)
      const ofacMatches = ofac.match({ firstName, lastName }, birthdate, { threshold: 0.85, fullNameThreshold: 0.95, debug: false })
      const isOfacSanctioned = _.size(ofacMatches) > 0
      customers.updateCustomer(customerId, { sanctions: !isOfacSanctioned }, userToken)

      return { ofacSanctioned: isOfacSanctioned }
    })
}

module.exports = {
  checkByUser
}
