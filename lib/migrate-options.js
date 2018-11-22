const _ = require('lodash/fp')
const fs = require('fs')
const makeDir = require('make-dir')
const path = require('path')

const load = require('./options-loader')

// current path of lamassu-server project
const currentBasePath = path.dirname(__dirname)
// get path as array of path components
const paths = _.wrap(_.split, path.sep)
// find the index of the lamassu-server directory
// /usr/lib/node_modules/lamassu-server/certs/Lamassu_OP.pem => 3
const indexOfLs = _.flow(paths, _.wrap(_.indexOf, 'lamassu-server'))

module.exports = {run, mapKeyValuesDeep, updateOptionBasepath}

function mapKeyValuesDeep (cb, obj, key) {
  if (_.isArray(obj)) {
    return _.mapValues((val, key) => mapKeyValuesDeep(cb, val, key), obj)
  } else if (_.isObject(obj)) {
    return _.pickBy((val, key) => mapKeyValuesDeep(cb, val, key), obj)
  } else {
    return cb(obj, key)
  }
}

function updateOptionBasepath (result, optionName) {
  const currentPath = _.get(optionName, result)

  // process only keys that contains
  // lamassu-server dir in its path
  const i = indexOfLs(currentPath)
  if (i === -1) {
    return
  }

  // workout the relative path
  // /usr/lib/node_modules/lamassu-server/certs/Lamassu_OP.pem => certs/Lamassu_OP.pem
  const rPath = _.drop(i + 1, paths(currentPath))

  // prepend the current lamassu-server path
  // certs/Lamassu_OP.pem => /usr/local/lib/node_modules/lamassu-server/certs/Lamassu_OP.pem
  const newPath = _.join(path.sep, _.concat([currentBasePath], rPath))

  // update this option
  // if the value has changed
  if (!_.isEqual(currentPath, newPath)) {
    console.log(`Migrating option ${optionName} to new path ${newPath}`)
    result[optionName] = newPath
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

  // get all the options
  // that ends with "Path" suffix
  console.log(`Detected lamassu-server basepath: ${currentBasePath}`)
  _.each(_.wrap(updateOptionBasepath, result),
    [
      'seedPath',
      'caPath',
      'certPath',
      'keyPath',
      'lamassuCaPath'
    ])

  const shouldMigrate = !_.isEqual(result, currentOpts) || _.has('lamassuServerPath', result)

  // write the resulting lamassu.json
  if (shouldMigrate) {
    // remove old lamassuServerPath config
    result = _.omit('lamassuServerPath', result)

    // find keys for which values
    // have been changed
    const differentValue = _.wrap(_.filter, key => !_.isEqual(result[key], currentOpts[key]))

    // output affected options
    const newOpts = _.pick(_.union(
      // find change keys
      differentValue(_.keys(result)),
      // find new opts
      _.difference(_.keys(result), _.keys(currentOpts))
    ), result)
    console.log('Updating options', newOpts)

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
