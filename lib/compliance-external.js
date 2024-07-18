const _ = require('lodash/fp')

const logger = require('./logger')
const configManager = require('./new-config-manager')
const ph = require('./plugin-helper')

const getPlugin = (settings, pluginCode) => {
  const account = settings.accounts[pluginCode]
  const plugin = ph.load(ph.COMPLIANCE, pluginCode)

  return ({ plugin, account })
}

const getStatus = (settings, service, customerId) => {
  try {
    const { plugin, account } = getPlugin(settings, service)

    return plugin.getApplicantStatus(account, customerId)
      .then((status) => ({
        service,
        status
      }))
      .catch((error) => {
        if (error.response.status !== 404) logger.error(`Error getting applicant for service ${service}:`, error.message)
        return {
          service: service,
          status: null,
        }
      })
  } catch (error) {
    logger.error(`Error loading plugin for service ${service}:`, error)
    return Promise.resolve({
      service: service,
      status: null,
    })
  }

}

const getStatusMap = (settings, customerExternalCompliance) => {
  const triggers = configManager.getTriggers(settings.config)
  const services = _.flow(
    _.map('externalService'),
    _.compact,
    _.uniq
  )(triggers)

  const applicantPromises = _.map(service => {
    return getStatus(settings, service, customerExternalCompliance)
  })(services)

  return Promise.all(applicantPromises)
    .then((applicantResults) => {
      return _.reduce((map, result) => {
        if (result.status) map[result.service] = result.status
        return map
      }, {})(applicantResults)
    })
}

const createApplicant = (settings, externalService, customerId) => {
  const account = settings.accounts[externalService]
  const { plugin } = getPlugin(settings, externalService)

  return plugin.createApplicant(account, customerId, account.applicantLevel)
}

const createLink = (settings, externalService, customerId) => {
  const account = settings.accounts[externalService]
  const { plugin } = getPlugin(settings, externalService)

  return plugin.createLink(account, customerId, account.applicantLevel)
}

module.exports = {
  getStatusMap,
  getStatus,
  createApplicant,
  createLink
}
