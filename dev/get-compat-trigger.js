const complianceTriggers = require('../lib/compliance-triggers')
const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

settingsLoader.loadLatest().then(settings => {
  const triggers = configManager.getTriggers(settings.config)
  const response = complianceTriggers.getBackwardsCompatibleTriggers(triggers)
  console.log(response)
})

