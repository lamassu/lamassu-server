const car = require('../lib/coinatmradar/coinatmradar')
const plugins = require('../lib/plugins')

require('../lib/new-settings-loader').loadLatest()
  .then(settings => {
    const pi = plugins(settings)

    return pi.getRawRates()
      .then(rates => {
        return car.update(rates, settings)
          .then(require('../lib/pp')('DEBUG100'))
          .catch(console.log)
          .then(() => process.exit())
      })
  })
