const dataParser = require('./data-paraser')
const nameUtils = require('./name-utils')
const jaroWinkler = require('talisman/metrics/distance/jaro-winkler')
const _ = require('lodash/fp')

const debug_log = require('./debug') // KOSTIS TODO: remove

let individuals = []

function load () {
  individuals = Array.from(dataParser.parseList())
}

// MATCHING

// birth date

function isDateWithinSomeDaysOfPeriod (period, date, days) {
  const inMillisecs = 24 * 60 * 60 * 1000

  const startTime = period.from.date.getTime() - days * inMillisecs
  const startDate = new Date(startTime)

  const endTime = period.to.date.getTime() + days * inMillisecs
  const endDate = new Date(endTime)

  return (startDate < date && date < endDate)
}

function isBornTooLongSince (individual, dateObject, days) {
  if (_.isEmpty(individual.birthDatePeriods)) return false
  const isWithinSomeYears = _.partialRight(isDateWithinSomeDaysOfPeriod, [dateObject.date, days])
  return !_.some(isWithinSomeYears, individual.birthDatePeriods)
}

// exact match

function calcExactMatchScore (candidateFullName) {
  return function (alias) {
    return jaroWinkler(alias.fullName, candidateFullName)
  }
}

// phonetic match

function calcPhoneticMatchScore (candidatePhoneticFullName) {
  return function (alias) {
    return jaroWinkler(alias.phoneticFullName, candidatePhoneticFullName)
  }
}

// algorithm

// NOTE: I'm still not 100% on what matching algorithm is the best choice.
// I just experiment with a few metrics for now.

const similarity = _.curry((candidate, individual) => {
  // Calculate if his birth date is within two years of the given date.
  // If an individual has multiple birth-date periods, return whether any are
  // within two years. Reject individuals who don't match this criterion.
  const twoYears = 365 * 2
  if (!isBornTooLongSince(individual, candidate.birthDate, twoYears)) return 0

  // Calculate the Jaro-Winkler similarity of the full name.
  // If an individual has multiple aliases, use the maximum score.
  const exactMatchScore = _.max(_.map(calcExactMatchScore(candidate.fullName), individual.aliases))

  // Calculate the Jaro-Winkler similarity of the phonetic representation of the full name.
  // This should approximate the phonetic similarity of the two names.
  // If an individual has multiple aliases, use the maximum score.
  const phoneticMatchScore = _.max(_.map(calcPhoneticMatchScore(candidate.phoneticFullName), individual.aliases))

  return _.max([exactMatchScore, phoneticMatchScore])
})

function match (parts, birthDateString) {
  // nameParts should be an object like {firstName: "John", lastName: "Doe", ...}
  const fullName = nameUtils.fullNameFromParts(parts)

  const phoneticParts = _.mapValues(nameUtils.phonetic, parts)
  const phoneticFullName = nameUtils.phonetic(fullName)

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  const candidate = {parts, fullName, phoneticParts, phoneticFullName, birthDate}

  const similarToCandidate = similarity(candidate)
  return _.max(similarToCandidate, individuals)
}

module.exports = {load, match}
