const _ = require('lodash/fp')
const fs = require('fs')
const makeDir = require('make-dir')

const load = require('./options-loader')

module.exports = {run, mapKeyValuesDeep}

function mapKeyValuesDeep (cb, obj, key) {
  if (_.isArray(obj)) {
    return _.mapValues((val, key) => mapKeyValuesDeep(cb, val, key), obj)
  } else if (_.isObject(obj)) {
    return _.pickBy((val, key) => mapKeyValuesDeep(cb, val, key), obj)
  } else {
    return cb(obj, key)
  }
}

async function run () {
  // load defaults
  const defaultOpts = require('../lamassu-default')

  // load current opts
  const options = load()
  const currentOpts = options.opts

  // check if there are new options to add
  let result = _.mergeAll([defaultOpts, currentOpts])
  const shouldMigrate = !_.isEqual(result, currentOpts) || _.has('lamassuServerPath', result)

  // write the resulting lamassu.json
  if (shouldMigrate) {
    // remove old lamassuServerPath config
    result = _.omit('lamassuServerPath', result)

    const newOpts = _.pick(_.difference(_.keys(result), _.keys(currentOpts)), result)
    console.log('Adding options', newOpts)

    // store new lamassu.json file
    fs.writeFileSync(options.path, JSON.stringify(result, null, '  '))
  }

  // get all the new options
  // that ends with "Dir" suffix
  mapKeyValuesDeep((v, k) => {
    if (_.endsWith('Dir', k)) {
      const path = _.attempt(() => makeDir.sync(v))

      if (_.isError(path)) {
        console.error(`Error while creating folder ${v}`, path)
      }
    }
  }, result)
}
