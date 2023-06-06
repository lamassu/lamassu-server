const _ = require('lodash')

const camelize = obj =>
  _.transform(obj, (acc, value, key, target) => {
    const camelKey = _.isArray(target) ? key : _.camelCase(key.toString())
    acc[camelKey] = _.isObject(value) && !(value instanceof Date) ? camelize(value) : value
  })

module.exports = camelize
