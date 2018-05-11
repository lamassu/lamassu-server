const car = require('../lib/coinatmradar/coinatmradar')
const plugins = require('../lib/plugins')

require('../lib/settings-loader').loadLatest()
  .then(settings => {
    const pi = plugins(settings)
    const config = settings.config

    return pi.getRates()
      .then(rates => {
        return car.update({rates, config})
          .then(require('../lib/pp')('DEBUG100'))
          .catch(console.log)
          .then(() => process.exit())
      })
  })
