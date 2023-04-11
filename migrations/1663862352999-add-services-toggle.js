const _ = require('lodash/fp')
const { saveAccounts, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  loadLatest()
    .then(({ accounts }) => saveAccounts(_.mapValues(it => ({ ...it, enabled: true }), _.cloneDeep(accounts))))
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
