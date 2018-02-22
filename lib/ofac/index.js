const dataParser = require('./data-parser')
const nameUtils = require('./name-utils')
const jaroWinkler = require('talisman/metrics/distance/jaro-winkler')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

let individuals = null

function load () {
  return dataParser.parseList()
  .then(list => {
    individuals = Array.from(list)
  })
}

// MATCHING

const mapMax = (iteratee, list) => _.max(_.map(iteratee, list))

// birth date

function isDateWithinSomeDaysOfPeriod (period, date, days) {
  const inMillisecs = 24 * 60 * 60 * 1000

  const startTime = period.start.date.getTime() - days * inMillisecs
  const startDate = new Date(startTime)

  const endTime = period.end.date.getTime() + days * inMillisecs
  const endDate = new Date(endTime)

  return (startDate < date && date < endDate)
}

function isBornTooLongSince (individual, dateObject, days) {
  if (_.isEmpty(individual.birthDatePeriods)) return false
  const isWithinSomeYears = _.partialRight(isDateWithinSomeDaysOfPeriod, [dateObject.date, days])
  return !_.some(isWithinSomeYears, individual.birthDatePeriods)
}

// string similarity

const stringMatch = _.curry(jaroWinkler)

const bestMatchInList = _.curry((list, name) => mapMax(stringMatch(name), list))

const aliasStringMatch = _.curry((candidate, alias) => {
  const matchWithCandidate = bestMatchInList(candidate.fullNames)
  return mapMax(matchWithCandidate, alias.fullNames)
})

// algorithm

const similarity = _.curry((candidate, individual) => {
  // Calculate if his birth date is within two years of the given date.
  // If an individual has multiple birth-date periods, return whether any are
  // within two years. Reject individuals who don't match this criterion.
  const twoYears = 365 * 2
  if (isBornTooLongSince(individual, candidate.birthDate, twoYears)) return 0

  debug_log(individual)

  // Calculate the Jaro-Winkler similarity of the full name.
  // If an individual has multiple aliases, use the maximum score.
  const scoreAgainstCandidate = aliasStringMatch(candidate)
  const stringMatchScore = mapMax(scoreAgainstCandidate, individual.aliases)

  // // Calculate the Jaro-Winkler similarity of the phonetic representation of the full name.
  // // This should approximate the phonetic similarity of the two names.
  // // If an individual has multiple aliases, use the maximum score.
  // const phoneticMatchScore = mapMax(calcPhoneticMatchScore(candidate.phoneticFullName))(individual.aliases)

  console.log(stringMatchScore)

  return _.max([stringMatchScore])
})

function match (nameParts, birthDateString) {
  if (!individuals) {
    const message = 'The OFAC data sources have not been loaded yet.'
    return Promise.reject(new Error(message))
  }

  // nameParts should be an object like {firstName: "John", lastName: "Doe", ...}
  const parts = _.mapValues(_.lowerCase, nameParts)
  const fullNames = nameUtils.makeFullNames(parts)

  const phoneticParts = _.mapValues(nameUtils.phonetic, parts)
  const phoneticFullNames = _.map(nameUtils.phonetic, fullNames)

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  const candidate = {parts, fullNames, phoneticParts, phoneticFullNames, birthDate}

  const similarToCandidate = similarity(candidate)
  const result = mapMax(similarToCandidate, individuals)
  debug_log(candidate)
  return result
}

module.exports = {load, match}
