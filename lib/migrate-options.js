const _ = require('lodash/fp')
const fs = require('fs')
const makeDir = require('make-dir')
const path = require('path')

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

  // get all the options
  // that ends with "Path" suffix
  const lsBasePath = path.dirname(__dirname)
  const paths = _.wrap(_.split, path.sep)
  const lsIndex = _.wrap(_.indexOf, 'lamassu-server')
  const basePath = _.flow(paths, lsIndex)
  console.log(`Detected lamassu-server basepath: ${lsBasePath}`)
  mapKeyValuesDeep((currentPath, optionName) => {
    // consider only option
    // that ends with Path
    if (!_.endsWith('Path', optionName)) {
      return;
    }

    // process only if contains
    // lamassu-server in its path
    const i = basePath(currentPath)
    if (i === -1) {
      return
    }

    // workout the relative path
    const rPath = _.drop(basePath(currentPath) + 1, paths(currentPath))

    // prepend the current lamassu-server path
    const newPath = _.join(path.sep, _.concat([lsBasePath], rPath))

    // update this option
    if (!_.isEqual(currentPath, newPath)) {
      console.log(`Migrating option ${optionName} to new path ${newPath}`)
    }

    result[optionName] = newPath
  }, result)

  const shouldMigrate = !_.isEqual(result, currentOpts) || _.has('lamassuServerPath', result)

  // write the resulting lamassu.json
  if (shouldMigrate) {
    // remove old lamassuServerPath config
    result = _.omit('lamassuServerPath', result)

    const differentValue = _.wrap(_.filter, key => !_.isEqual(result[key], currentOpts[key]))

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
