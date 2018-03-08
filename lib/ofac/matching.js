const jaroWinkler = require('talisman/metrics/distance/jaro-winkler')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

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
  if (!dateObject) return false
  if (_.isEmpty(individual.birthDatePeriods)) return false
  const isWithinSomeYears = _.partialRight(isDateWithinSomeDaysOfPeriod, [dateObject.date, days])
  return !_.some(isWithinSomeYears, individual.birthDatePeriods)
})

// algorithm

function match (structs, candidate, threshold) {
  const {fullName, wordPhonetics, wordValues, birthDate} = candidate

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
    const entryMatches = entry => (stringSimilarity(value, entry.value) >= threshold)
    return _.filter(entryMatches, structs.wordList)
  }
  const getSingleEntries = wordEntry => {
    const makeEntry = aliasId => ({value: wordEntry.value, aliasId})
    return _.map(makeEntry, wordEntry.aliasIds)
  }
  const stringMatches = _.flow(
    _.flatMap(getStringMatches),
    _.flatMap(getSingleEntries)
  )(wordValues)

  // At least two name-parts must match per alias
  const adequateMatch = ([aliasId, count]) => {
    const alias = structs.aliasesMap.get(aliasId)
    return count >= Math.min(2, alias.words.length)
  }
  const aliasIdsFromNamePart = _.flow(
    _.uniqWith((a, b) => a.value === b.value && a.aliasId === b.aliasId),
    _.map(_.get('aliasId')),
    _.countBy(_.identity),
    _.toPairs,
    _.filter(adequateMatch),
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
  return _.reject(unqualified, suspects)
}

module.exports = {match}
