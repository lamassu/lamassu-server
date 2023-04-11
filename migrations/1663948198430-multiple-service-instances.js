const _ = require('lodash/fp')
const uuid = require('uuid')
const { saveAccounts, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  loadLatest()
    .then(({ accounts: _accounts }) => {
      const accounts = _.cloneDeep(_accounts)
      const newAccounts = _.mapValues((it, key) => {
        const elementValues = _.zipObject(_.keys(it), [..._.map(ite => it[ite], _.keys(it))])
        elementValues.id = uuid.v4()
        elementValues.enabled = it.enabled ?? true
        elementValues.code = key
        return { instances: [elementValues] }
      }, accounts)
      return saveAccounts(newAccounts, false)
    })
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
