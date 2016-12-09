const util = require('util')
const config = require('./admin/config')

function valid () {
  return config.validateConfig()
  .then(errors => {
    if (errors.length === 0) return
    throw new Error('Schema validation error: ' + util.inspect(errors, {colors: true}))
  })
}

module.exports = {valid}
