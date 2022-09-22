const _ = require('lodash/fp')
const uuid = require('uuid')
const { saveAccounts, loadLatest } = require('../lib/new-settings-loader')

exports.up = function (next) {
  loadLatest()
    .then(({ accounts }) => saveAccounts(_.mapValues(it => {
      const accountElements = [..._.map(ite => ite.code, it.elements), 'enabled']
      const elementValues = _.zipObject(accountElements, [..._.map(ite => it[ite], accountElements)])
      elementValues.id = uuid.v4()
      return { ..._.omit([accountElements, 'title'], it), instances: [elementValues] }
    }, _.cloneDeep(accounts)), false))
    .then(() => next())
    .catch(err => {
      console.log(err.message)
      return next(err)
    })
}

exports.down = function (next) {
  next()
}
