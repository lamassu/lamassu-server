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

// similarity algorithm

const stringSimilarity = _.curry(jaroWinkler)

// birth date

function isDateWithinSomeDaysOfPeriod (period, date, days) {
  const inMillisecs = 24 * 60 * 60 * 1000

  const startTime = period.start.date.getTime() - days * inMillisecs
  const startDate = new Date(startTime)

  const endTime = period.end.date.getTime() + days * inMillisecs
  const endDate = new Date(endTime)

  return (startDate < date && date < endDate)
}

const isBornTooLongSince = _.curry((days, dateObject, individual) => {
  if (_.isEmpty(individual.birthDatePeriods)) return false
  const isWithinSomeYears = _.partialRight(isDateWithinSomeDaysOfPeriod, [dateObject.date, days])
  return !_.some(isWithinSomeYears, individual.birthDatePeriods)
})

// nameParts should be an object like {firstName: "John", lastName: "Doe", ...}

function makeCompatible (nameParts) {
  const partNames = _.keys(nameParts)
  const values = _.values(nameParts)
  const props = _.zipAll([partNames, values])
  return _.map(_.zipObject(['partName', 'value']), props)
}

// algorithm

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
  const wordPhonetics = _.flatten(_.map(_.get('phonetics'), words))

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  debug_log({parts, fullName, wordValues, wordPhonetics, birthDate})

  // Start matching

  // Accept aliases who's full name matches.
  const doesNameMatch = _.flow(
    _.get('fullName'),
    stringSimilarity(fullName),
    _.lte(threshold)
  )
  const aliases = _.flatMap(_.get('aliases'), structs.individuals)
  const aliasIdsFromFullName = _.flow(
    _.filter(doesNameMatch),

    _.map(_.get('id'))
  )(aliases)

  // Gather aliases who's name-parts match phonetically.
  const getPhoneticMatches = phonetic => structs.phoneticMap.get(phonetic)
  const phoneticMatches = _.flow(
    _.map(getPhoneticMatches),
    _.compact,
    _.flatten
  )(wordPhonetics)

  // Gether aliases whose name-parts match alphabetically.
  const getStringMatches = value => {
    const entryMatches = entry => (jaroWinkler(value, entry.value) >= threshold)
    return _.filter(entryMatches, structs.wordList)
  }
  const getSingleEntries = wordEntry => {
    const makeEntry = aliasId => ({value: wordEntry.value, aliasId})
    return _.map(makeEntry, wordEntry.aliasIds)
  }
  const stringMatches = _.flow(
    _.map(getStringMatches),
    _.flatten,
    _.map(getSingleEntries),
    _.flatten
  )(wordValues)

  // At least two name-parts must match per alias
  const aliasIdsFromNamePart = _.flow(
    _.uniqWith(_.isEqual),
    _.map(_.get('aliasId')),
    _.countBy(_.identity),
    _.toPairs,
    _.filter(_.flow(_.last, _.lte(2))),
    _.map(_.first)
  )([...phoneticMatches, ...stringMatches])

  // Get the full record for each matched id
  const getIndividual = aliasId => {
    const individualId = structs.aliasToIndividual.get(aliasId)
    return structs.individualsMap.get(individualId)
  }
  const suspects = _.uniq(_.map(getIndividual, [
    ...aliasIdsFromFullName,
    ...aliasIdsFromNamePart
  ]))

  // Reject everyone who is born two years away.
  const twoYears = 365 * 2
  const unqualified = isBornTooLongSince(twoYears, birthDate)
  const result = _.reject(unqualified, suspects)

  debug_log(result)
  return result
}

module.exports = {load, match}
