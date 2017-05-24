const settingsLoader = require('../lib/settings-loader')

const fields = [
  settingsLoader.configDeleteField({crypto: 'ETH', machine: 'global'}, 'exchange')
]

settingsLoader.modifyConfig(fields)
.then(() => {
  console.log('success.')
  process.exit(0)
})
