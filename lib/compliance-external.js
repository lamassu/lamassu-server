const _ = require('lodash/fp')

const configManager = require('./new-config-manager')
const ph = require('./plugin-helper')

const getPlugin = settings => {
  const pluginCodes = ['sumsub']
  const enabledAccounts = _.filter(_plugin => _plugin.enabled, _.map(code => ph.getAccountInstance(settings.accounts[code], code), pluginCodes))
  if (_.isEmpty(enabledAccounts)) {
    throw new Error('No external compliance services are active. Please check your 3rd party service configuration')
  }

  if (_.size(enabledAccounts) > 1) {
    throw new Error('Multiple external compliance services are active. Please check your 3rd party service configuration')
  }
  const account = _.head(enabledAccounts)
  const plugin = ph.load(ph.COMPLIANCE, account.code, account.enabled)

  return ({ plugin, account })
}

const createApplicant = (settings, customer, applicantLevel) => {
  const { plugin } = getPlugin(settings)
  const { id } = customer
  return plugin.createApplicant({ levelName: applicantLevel, externalUserId: id })
}

const getApplicant = (settings, customer) => {
  try {
    const { plugin } = getPlugin(settings)
    const { id } = customer
    return plugin.getApplicant({ externalUserId: id }, false)
      .then(res => ({
        provider: plugin.CODE,
        ...res.data
      }))
      .catch(() => ({}))
  } catch (e) {
    return {}
  }
}

const createApplicantAccessToken = (settings, customerId, triggerId) => {
  const triggers = configManager.getTriggers(settings.config)
  const trigger = _.find(it => it.id === triggerId)(triggers)
  const { plugin } = getPlugin(settings)
  return plugin.createApplicantAccessToken({ levelName: trigger.externalServiceApplicantLevel, userId: customerId })
    .then(r => r.data.token)
}

module.exports = {
  createApplicant,
  getApplicant,
  createApplicantAccessToken
}
