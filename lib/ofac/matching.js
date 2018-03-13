const jaro = require('talisman/metrics/distance/jaro')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

const stringSimilarity = _.curry(jaro)

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
  const {fullName, words, birthDate} = candidate

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


  const aliasIds = []
  const phoneticWeight = 0.17
  const stringWeight = 1 - phoneticWeight

  for (const word of words) {
    const getPhonetic = phonetic => structs.phoneticMap.get(phonetic)
    const phoneticMatches = new Set(_.flatMap(getPhonetic, word.phonetics))

    for (const wordEntry of structs.wordList) {
      const stringScore = stringSimilarity(word.value, wordEntry.value)

      if (stringWeight * stringScore + phoneticWeight < threshold) continue

      for (const aliasId of wordEntry.aliasIds) {
        const phoneticScore = phoneticMatches.has(aliasId) ? 1 : 0
        const finalScore = stringWeight * stringScore + phoneticWeight * phoneticScore

        if (finalScore >= threshold) {
          aliasIds.push(aliasId)
        }
      }
    }
  }

  const aliasIdsFromNamePart = _.flow(
    _.countBy(_.identity),
    _.toPairs,
    _.reject(_.flow(
      _.last,
      _.gt(2)
    )),
    _.map(_.first)
  )(aliasIds)

  // debug_log(aliasIdsFromFullName)
  // debug_log(aliasIdsFromNamePart)

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
