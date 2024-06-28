const { readdir } = require('fs/promises')
const path = require('path')
const loader = require('./loading')
const matcher = require('./matching')
const nameUtils = require('./name-utils')
const _ = require('lodash/fp')
const logger = require('../logger')

const OFAC_DATA_DIR = process.env.OFAC_DATA_DIR

let structs = null

function load () {
  if (!OFAC_DATA_DIR) {
    const message = 'The ofacDataDir option has not been set in the environment'
    return Promise.reject(new Error(message))
  }

  const ofacSourcesDir = path.join(OFAC_DATA_DIR, 'sources')

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
  const result = matcher.match(structs, candidate, options)
  return result
}

function getStructs () {
  return structs
}

module.exports = {load, match, getStructs}
