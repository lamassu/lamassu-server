const externalCompliance = require('../../../compliance-external')
const { loadLatest } = require('../../../new-settings-loader')

const resolvers = {
  Query: {
    getApplicantAccessToken: (...[, { customerId, triggerId }]) => loadLatest()
      .then(settings => externalCompliance.createApplicantAccessToken(settings, customerId, triggerId))
  }
}

module.exports = resolvers
