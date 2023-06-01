const _ = require('lodash')

const camelize = (deep = true) => obj => {
  if (!_.isNil(obj)) {
    return _.transform(obj, (acc, value, key, target) => {
      const camelKey = _.isArray(target) ? key : _.camelCase(key.toString())
      acc[camelKey] = _.isObject(value) && !(value instanceof Date) && deep ? camelize(deep)(value) : value
    })
  }
  return obj
}

module.exports = camelize
