const _ = require('lodash/fp')
const { saveConfig, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  loadLatest()
    .then(({ config }) => {
      const fiatBalance1 = config.notifications_fiatBalanceCassette1
      const fiatBalance2 = config.notifications_fiatBalanceCassette2

      if (fiatBalance1) {
        config.notifications_fiatBalanceCassette1 = (100 * (fiatBalance1 / 500)).toFixed(0)
      }
      if (fiatBalance2) {
        config.notifications_fiatBalanceCassette2 = (100 * (fiatBalance2 / 500)).toFixed(0)
      }

      const {
        notifications_fiatBalanceCassette1: notifications_fillingPercentageCassette1,
        notifications_fiatBalanceCassette2: notifications_fillingPercentageCassette2,
        ...rest
      } = config

      config = { notifications_fillingPercentageCassette1, notifications_fillingPercentageCassette2, ...rest }

      config.notifications_fiatBalanceOverrides = _.map(override => {
        if (override.fiatBalanceCassette1) {
          override.fiatBalanceCassette1 = (100 * (override.fiatBalanceCassette1 / 500)).toFixed(0)
        }
        if (override.fiatBalanceCassette2) {
          override.fiatBalanceCassette2 = (100 * (override.fiatBalanceCassette2 / 500)).toFixed(0)
        }
        const {
          fiatBalanceCassette1: fillingPercentageCassette1,
          fiatBalanceCassette2: fillingPercentageCassette2,
          ...rest } = override
        return { fillingPercentageCassette1, fillingPercentageCassette2, ...rest }
      }, config.notifications_fiatBalanceOverrides)

      return saveConfig(config)
        .then(() => next())
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
