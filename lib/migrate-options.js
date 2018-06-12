const _ = require('lodash/fp')
const fs = require('fs')
const makeDir = require('make-dir')

const load = require('./options-loader')

module.exports = {run}

async function run () {
  // load defaults
  const defaultOpts = require('../lamassu-default')

  // load current opts
  const options = load()
  const currentOpts = options.opts

  // check if there are new options to add
  const result = _.mergeAll([defaultOpts, currentOpts])
  const shouldMigrate = !_.isEqual(result, currentOpts)

  // write the resulting lamassu.json
  if (shouldMigrate) {
    const newOpts = _.pick(_.difference(_.keys(result), _.keys(currentOpts)), result)
    console.log('Adding options', newOpts)

    // store new lamassu.json file
    fs.writeFileSync(options.path, JSON.stringify(result, null, '  '))
  }

  // get all the new options
  // that ends with "Dir" suffix
  const dirOpts = _.pickBy((v, k) => {
    return _.endsWith('Dir', k) && !fs.existsSync(v)
  }, result)

  // create directories for new "*Dir" options
  _.forEach((dir) => {
    console.log(`Creating folder ${dir}`)
    makeDir.sync(dir)
  }, dirOpts)
}
