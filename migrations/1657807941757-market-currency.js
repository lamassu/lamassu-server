const _ = require('lodash/fp')
const { loadLatest, saveAccounts } = require('../lib/new-settings-loader')
const { ACCOUNT_LIST } = require('../lib/new-admin/config/accounts')
const { ALL } = require('../lib/plugins/common/ccxt')

exports.up = function (next) {
  return loadLatest()
    .then(({ accounts }) => {
      const allExchanges = _.map(it => it.code)(_.filter(it => it.class === 'exchange', ACCOUNT_LIST))
      const configuredExchanges = _.intersection(allExchanges, _.keys(accounts))

      const newAccounts = _.reduce(
        (acc, value) => {
          if (!_.isNil(accounts[value].currencyMarket)) return acc
          if (_.includes('EUR', ALL[value].FIAT)) return { ...acc, [value]: { currencyMarket: 'EUR' } }
          return { ...acc, [value]: { currencyMarket: ALL[value].DEFAULT_FIAT_CURRENCY } }
        },
        {},
        configuredExchanges
      )

      return saveAccounts(newAccounts)
    })
    .then(next)
    .catch(next)
}

module.exports.down = function (next) {
  next()
}
