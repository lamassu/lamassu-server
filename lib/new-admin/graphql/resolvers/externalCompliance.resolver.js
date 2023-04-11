const externalCompliance = require('../../../compliance-external')
const { loadLatest } = require('../../../new-settings-loader')

const resolvers = {
  Query: {
    getApplicantExternalLink: (...[, { customerId, triggerId }]) => loadLatest()
      .then(settings => externalCompliance.createApplicantExternalLink(settings, customerId, triggerId))
  }
}

module.exports = resolvers
