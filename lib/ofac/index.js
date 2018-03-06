const fs = require('fs')
const path = require('path')
const util = require('util')
const parser = require('./parsing')
const matcher = require('./matching')
const nameUtils = require('./name-utils')
const options = require('../options')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

const OFAC_DATA_DIR = options.ofacDataDir

let structs = null

const readdir = util.promisify(fs.readdir)

function load () {
  // NOTE: Not sure how you push code updates to existing clients. This problem
  // might pop up if new code is pushed, without re-doing setup.
  if (!OFAC_DATA_DIR) {
    const message = 'The ofacDataDir option has not been set in lamassu.json'
    return Promise.reject(new Error(message))
  }

  return readdir(OFAC_DATA_DIR)
  .then(_.flow(
    _.map(file => path.join(OFAC_DATA_DIR, file)),
    parser.parse
  ))
  .then(result => {
    structs = result
  })
}

// nameParts should be an object like {firstName: "John", lastName: "Doe", ...}

function makeCompatible (nameParts) {
  const partNames = _.keys(nameParts)
  const values = _.values(nameParts)
  const props = _.zipAll([partNames, values])
  return _.map(_.zipObject(['partName', 'value']), props)
}

function match (nameParts, birthDateString, threshold) {
  if (!structs) {
    const message = 'The OFAC data sources have not been loaded yet.'
    return Promise.reject(new Error(message))
  }

  // Prepare the input data

  const parts = makeCompatible(nameParts)
  const fullName = nameUtils.makeFullName(parts)
  const words = nameUtils.makeWords(fullName)

  const wordValues = _.map(_.get('value'), words)
  const wordPhonetics = _.flatMap(_.get('phonetics'), words)

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  const candidate = {parts, fullName, wordValues, wordPhonetics, birthDate}
  // debug_log(candidate)

  const result = matcher.match(structs, candidate, threshold)
  // debug_log(result)
  return result
}

module.exports = {load, match}
