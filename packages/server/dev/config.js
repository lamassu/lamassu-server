const settingsLoader = require('../lib/new-settings-loader')
const configManager = require('../lib/new-config-manager')

settingsLoader.loadLatest()
  .then(settings => {
    const config = settings.config
    require('../lib/pp')('config')(configManager.getAllCryptoCurrencies(config))
  })
