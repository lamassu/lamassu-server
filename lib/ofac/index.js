const dataParser = require('./data-parser')
const nameUtils = require('./name-utils')
const jaroWinkler = require('talisman/metrics/distance/jaro-winkler')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

let structs = null

function load () {
  return dataParser.produceStructs()
  .then(result => {
    structs = result
  })
}

// MATCHING

const mapMax = (iteratee, list) => _.max(_.map(iteratee, list))

const allPairs = _.flow(
  (aList, bList) => _.map(a => _.map(b => [a, b], bList), aList),
  _.flatten
)

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

// similarity algorithm

const stringSimilarity = _.curry(jaroWinkler)

const wordSimilarity = (a, b) => {
  const phoneticPairs = allPairs(a.phonetic, b.phonetic)
  const phoneticMatch = _.map(_.spread(_.isEqual), phoneticPairs)
  if (_.some(_.identity, phoneticMatch)) return 1
  return stringSimilarity(a.value, b.value)
}

const similarity = _.curry((candidate, individual) => {
  // Calculate if his birth date is within two years of the given date.
  // If an individual has multiple birth-date periods, return whether any are
  // within two years. Reject individuals who don't match this criterion.
  const twoYears = 365 * 2
  if (isBornTooLongSince(individual, candidate.birthDate, twoYears)) return 0

  debug_log(individual)

  // Calculate the Jaro-Winkler similarity of the full name.
  // If an individual has multiple aliases, use the maximum score.
  const scoreCandidateFullName = _.flow(
    _.get('fullName'),
    stringSimilarity(candidate.fullName)
  )
  const stringMatchScore = mapMax(scoreCandidateFullName, individual.aliases)

  //

  const candidateWords = candidate.fullNameWords
  const numCandidateWords = candidateWords.length

  const scoreCandidateWords = alias => {
    const tooManyWords = _.flow(
      _.get(['words', 'length']),
      _.lt(numCandidateWords)
    )
    const parts = _.reject(tooManyWords, alias.parts)

    const scorePartAt = _.curry((part, offset) => {
      const words = _.slice(offset, offset + part.words.length, candidateWords)
      return _.min(_.map(_.spread(wordSimilarity), _.zip(words, part.words)))
    })
    const scorePart = part => {
      const offsets = _.range(0, (numCandidateWords - part.words.length) + 1)
      return mapMax(scorePartAt(part), offsets)
    }
    const scores = _.orderBy([], 'desc', _.map(scorePart, parts))
    const thresholdIndex = _.min([2, scores.length]) - 1
    return scores[thresholdIndex]
  }
  const wordMatchScore = mapMax(scoreCandidateWords, individual.aliases)

  console.log(stringMatchScore, wordMatchScore)

  return _.max([stringMatchScore, wordMatchScore])
})

// nameParts should be an object like {firstName: "John", lastName: "Doe", ...}
function makeCompatible (nameParts) {
  const partNames = _.keys(nameParts)
  const values = _.values(nameParts)
  const props = _.zipAll([partNames, values])
  return _.map(_.zipObject(['partName', 'value']), props)
}

function match (nameParts, birthDateString) {
  if (!structs) {
    const message = 'The OFAC data sources have not been loaded yet.'
    return Promise.reject(new Error(message))
  }

  const parts = makeCompatible(nameParts)
  const fullName = nameUtils.makeFullName(parts)
  const fullNameWords = nameUtils.makeWords(fullName)

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  const candidate = {parts, fullName, fullNameWords, birthDate}
  debug_log(candidate)

  const similarToCandidate = similarity(candidate)
  const result = mapMax(similarToCandidate, structs.individuals)
  console.log(result)
  return result
}

module.exports = {load, match}
