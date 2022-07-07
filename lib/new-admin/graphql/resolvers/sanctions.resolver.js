const _ = require('lodash/fp')
const ofac = require('../../../ofac')

const resolvers = {
  Query: {
    checkAgainstSanctions: (...[, { firstName, lastName, birthdate }]) => {
      const ofacMatches = ofac.match({ firstName, lastName }, birthdate, { threshold: 0.85, fullNameThreshold: 0.95, debug: false })

      return { ofacSanctioned: _.size(ofacMatches) > 0 }
    }
  }
}

module.exports = resolvers
