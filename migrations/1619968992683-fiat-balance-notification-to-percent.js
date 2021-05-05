const _ = require('lodash/fp')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')
const { cassetteMaxCapacity } = require('../lib/constants')

exports.up = function (next) {
  return loadLatest()
    .then(({ config }) => {
      const fiatBalance1 = config.notifications_fiatBalanceCassette1
      const fiatBalance2 = config.notifications_fiatBalanceCassette2
      const overrides = config.notifications_fiatBalanceOverrides
      const newConfig = {}
      if (fiatBalance1) {
        newConfig.notifications_fillingPercentageCassette1 = (100 * (fiatBalance1 / cassetteMaxCapacity)).toFixed(0)
        newConfig.notifications_fiatBalanceCassette1 = null
      }
      if (fiatBalance2) {
        newConfig.notifications_fillingPercentageCassette2 = (100 * (fiatBalance2 / cassetteMaxCapacity)).toFixed(0)
        newConfig.notifications_fiatBalanceCassette2 = null
      }

      if (overrides) {
        newConfig.notifications_fiatBalanceOverrides = _.map(override => {
          if (override.fiatBalanceCassette1) {
            override.fiatBalanceCassette1 = (100 * (override.fiatBalanceCassette1 / cassetteMaxCapacity)).toFixed(0)
          }
          if (override.fiatBalanceCassette2) {
            override.fiatBalanceCassette2 = (100 * (override.fiatBalanceCassette2 / cassetteMaxCapacity)).toFixed(0)
          }
          const {
            fiatBalanceCassette1: fillingPercentageCassette1,
            fiatBalanceCassette2: fillingPercentageCassette2,
            ...rest } = override
          return { fillingPercentageCassette1, fillingPercentageCassette2, ...rest }
        }, config.notifications_fiatBalanceOverrides)
      }
      return saveConfig(newConfig)
        .then(() => {})
    })
    .catch(err => {
      if (err.message === 'lamassu-server is not configured') {
        return next()
      }
      console.log(err.message)
      return next(err)
    })
}

module.exports.down = function (next) {
  next()
}
