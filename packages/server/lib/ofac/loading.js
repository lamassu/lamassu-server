const fs = require('fs')
const ndjson = require('ndjson')
const _ = require('lodash/fp')


const mapAliases = _.curry((iteratee, individuals) => {
  const mapIndividual = individual => {
    const {id, aliases} = individual
    return _.map(alias => iteratee(id, alias), aliases)
  }
  return _.flatMap(mapIndividual, individuals)
})


const getPhoneticEntries = (individualId, alias) => {
  const pairPhoneticsWithValues = word => {
    const {value, phonetics} = word
    const makeEntry = phonetic => ({value, phonetic, aliasId: alias.id})
    return _.map(makeEntry, phonetics)
  }
  return _.flatMap(pairPhoneticsWithValues, alias.words)
}

const producePhoneticMap = _.flow(
  mapAliases(getPhoneticEntries),
  _.flatten,
  _.groupBy(_.get('phonetic')),
  _.mapValues(_.flow(
    _.map(_.get('aliasId')),
    _.uniq
  )),
  _.toPairs,
  entries => new Map(entries)
)


const getWords = (individualId, alias) => {
  const pairWordsWithIds = word => ({value: word.value, aliasId: alias.id})
  return _.map(pairWordsWithIds, alias.words)
}

const produceWordList = _.flow(
  mapAliases(getWords),
  _.flatten,
  _.groupBy(_.get('value')),
  _.mapValues(_.map(_.get('aliasId'))),
  _.toPairs,
  _.map(_.zipObject(['value', 'aliasIds']))
)

const parseSource = source => {
  const individuals = []

  const readStream = fs.createReadStream(source)
  const jsonStream = readStream.pipe(ndjson.parse())
  jsonStream.on('data', individual => {
    _.forEach(period => {
      _.forEach(date => {
        const {year, month, day} = date
        date.date = new Date(year, month - 1, day)
      }, [period.start, period.end])
    }, individual.birthDatePeriods)
    individuals.push(individual)
  })

  return new Promise((resolve, reject) => {
    jsonStream.on('error', reject)
    jsonStream.on('end', () => {
      resolve(individuals)
    })
  })
}

const load = sources => Promise.all(_.map(parseSource, sources))
  .then(_.flow(
    _.flatten,
    _.compact,
    _.uniqBy(_.get('id')),
    individuals => {

      const individualsMap = _.flow(
        _.groupBy(_.get('id')),
        _.mapValues(_.first),
        _.toPairs,
        entries => new Map(entries)
      )(individuals)

      const makeEntries = (individualId, alias) => [alias.id, alias]
      const aliasesMap = new Map(mapAliases(makeEntries, individuals))

      const getIdPairs = (individualId, alias) => [alias.id, individualId]
      const idPairs = mapAliases(getIdPairs, individuals)
      const aliasToIndividual = new Map(idPairs)

      const phoneticMap = producePhoneticMap(individuals)
      const wordList = produceWordList(individuals)

      return {
        individuals,
        individualsMap,
        aliasesMap,
        aliasToIndividual,
        phoneticMap,
        wordList
      }
    }
  ))

module.exports = {load}
