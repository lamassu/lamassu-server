const settingsLoader = require('../lib/settings-loader')
const configManager = require('../lib/config-manager')

settingsLoader.loadLatest()
  .then(settings => {
    const config = settings.config
    require('../lib/pp')('config')(configManager.all('cryptoCurrencies', config))
  })
