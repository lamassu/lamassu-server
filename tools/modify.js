const settingsLoader = require('../lib/settings-loader')

const fields = [
  settingsLoader.configDeleteField({crypto: 'global', machine: 'global'}, 'cashOutFee'),
  settingsLoader.configDeleteField({crypto: 'global', machine: 'global'}, 'minTx')
]

settingsLoader.modifyConfig(fields)
.then(() => {
  console.log('success.')
  process.exit(0)
})
