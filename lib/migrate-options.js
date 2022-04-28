const _ = require('lodash/fp')
const fs = require('fs')
const os = require('os')
const makeDir = require('make-dir')
const path = require('path')
const cp = require('child_process')

const load = require('./options-loader')
const logger = require('./logger')

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
    logger.info(`Migrating option ${optionName} to new path ${newPath}`)
    result[optionName] = newPath
  }
}

async function run () {
  // load current opts
  const options = load().opts
  const shouldMigrate = !fs.existsSync(process.env.NODE_ENV === 'production' ? path.resolve(os.homedir(), '.lamassu', '.env') : path.resolve(__dirname, '../.env'))

  // write the resulting .env
  if (shouldMigrate) {
    const postgresPw = new RegExp(':(\\w*)@').exec(options.postgresql)[1]
    cp.spawnSync('node', ['tools/build-prod-env.js', '--db-password', postgresPw, '--hostname', options.hostname], { cwd: currentBasePath, encoding: 'utf-8' })
  }
}
