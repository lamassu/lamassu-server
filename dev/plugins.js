const plugins = require('../lib/plugins')
const settingsLoader = require('../lib/settings-loader')
const pp = require('../lib/pp')

settingsLoader.loadLatest()
  .then(settings => {
    console.log('DEBUG300')
    const pi = plugins(settings)
    pi.getRates().then(r => console.log(JSON.stringify(r)))
  })
