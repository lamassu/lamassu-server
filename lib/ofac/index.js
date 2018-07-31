const fs = require('fs')
const path = require('path')
const util = require('util')
const loader = require('./loading')
const matcher = require('./matching')
const nameUtils = require('./name-utils')
const options = require('../options')
const _ = require('lodash/fp')
const logger = require('../logger')

const debugLog = require('../pp')(__filename) // KOSTIS TODO: remove

let structs = null

const readdir = util.promisify(fs.readdir)

function load () {
  if (!options.ofacDataDir) {
    const message = 'The ofacDataDir option has not been set in lamassu.json'
    return Promise.reject(new Error(message))
  }

  const ofacSourcesDir = path.join(options.ofacDataDir, 'sources')

  return readdir(ofacSourcesDir)
    .then(_.flow(
      _.map(file => path.join(ofacSourcesDir, file)),
      loader.load
    ))
    .then(result => {
      return (structs = result)
    })
}

// nameParts should be an object like {firstName: "John", lastName: "Doe", ...}

function makeCompatible (nameParts) {
  const partNames = _.keys(nameParts)
  const values = _.map(_.lowerCase, _.values(nameParts))
  const props = _.zipAll([partNames, values])
  return _.map(_.zipObject(['partName', 'value']), props)
}

function match (nameParts, birthDateString, options) {
  const {debug} = options

  if (!structs) {
    logger.error(new Error('The OFAC data sources have not been loaded yet.'))
    return false
  }

  // Prepare the input data
  const parts = makeCompatible(nameParts)
  const fullName = nameUtils.makeFullName(parts)
  const words = nameUtils.makeWords(fullName)

  // birthDateString is in YYYYMMDD format
  const birthDate = _.cond([
    [_.identity, () => {
      const year = parseInt(birthDateString.slice(0, 4))
      const month = parseInt(birthDateString.slice(4, 6))
      const day = parseInt(birthDateString.slice(6, 8))
      const date = new Date(year, month - 1, day)

      return {year, month, day, date}
    }],
    [_.stubTrue, () => null]
  ])(birthDateString)

  const candidate = {parts, fullName, words, birthDate}
  debug && debugLog(candidate)

  const result = matcher.match(structs, candidate, options)
  debug && debugLog(result)
  return result
}

module.exports = {load, match}
