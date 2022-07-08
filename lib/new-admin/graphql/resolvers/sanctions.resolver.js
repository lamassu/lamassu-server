const _ = require('lodash/fp')
const logger = require('../../../logger')
const ofac = require('../../../ofac')
const T = require('../../../time')

const sanctionStatus = {
  loaded: false,
  timestamp: null
}

const loadOrUpdateSanctions = () => {
  if (!sanctionStatus.loaded || (sanctionStatus.timestamp && Date.now() > sanctionStatus.timestamp + T.minute)) {
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

const resolvers = {
  Query: {
    checkAgainstSanctions: (...[, { firstName, lastName, birthdate }]) => loadOrUpdateSanctions()
      .then(() => {
        const ofacMatches = ofac.match({ firstName, lastName }, birthdate, { threshold: 0.85, fullNameThreshold: 0.95, debug: false })
        return { ofacSanctioned: _.size(ofacMatches) > 0 }
      })
  }
}

module.exports = resolvers
