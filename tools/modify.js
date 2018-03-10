const settingsLoader = require('../lib/settings-loader')

const fields = [
  settingsLoader.configDeleteField({crypto: 'BTC', machine: 'global'}, 'wallet')
]

settingsLoader.modifyConfig(fields)
  .then(() => {
    console.log('success.')
    process.exit(0)
  })
