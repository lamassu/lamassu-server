const settingsLoader = require('../lib/settings-loader')
const pp = require('../lib/pp')

settingsLoader.loadLatest()
  .then(r => {
    pp('config')(r)
    process.exit(0)
  })
  .catch(e => {
    console.log(e.stack)
    process.exit(1)
  })
