const fs = require('fs')
const XmlStream = require('xml-stream')
const nameUtils = require('./name-utils')
const logger = require('../logger')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

// KOSTIS TODO: get these from the document itself
const INDIVIDUAL = '4'
const NAME = '1403'
const BIRTH_DATE = '8'
const PRIMARY_LATIN = '1'

const LAST_NAME = '1520'
const FIRST_NAME = '1521'
const MIDDLE_NAME = '1522'
const MAIDEN_NAME = '1523'
const PATRONYMIC = '91708'
const MATRONYMIC = '91709'
const NICKNAME = '1528'

const partNames = new Map([
  [LAST_NAME, 'lastName'],
  [FIRST_NAME, 'firstName'],
  [MIDDLE_NAME, 'middleName'],
  [MAIDEN_NAME, 'maidenName'],
  [PATRONYMIC, 'patronymic'],
  [MATRONYMIC, 'matronymic'],
  [NICKNAME, 'nickname']
])

// group-id to type-id

function processMasterNamePartGroup (groupNode) {
  const namePartGroupNode = groupNode.NamePartGroup
  const groupId = namePartGroupNode.$.ID
  const typeId = namePartGroupNode.$.NamePartTypeID
  return [groupId, typeId]
}

const processDocumentedNamePart = _.curry((groupTypes, namePartNode) => {
  const valueNode = namePartNode.NamePartValue
  const groupId = valueNode.$.NamePartGroupID
  const typeId = groupTypes.get(groupId)
  const partName = partNames.get(typeId)
  const value = _.lowerCase(valueNode.$text)
  return {partName, value}
})

const isLatin = _.matchesProperty(['$', 'DocNameStatusID'], PRIMARY_LATIN)

const processAlias = _.curry((groupTypes, aliasNode) => {
  if (aliasNode.$.AliasTypeID !== NAME) return
  if (aliasNode.$.LowQuality === 'true') return

  const getNamePart = processDocumentedNamePart(groupTypes)
  const latinNameNode = _.find(isLatin, aliasNode.DocumentedName)
  if (!latinNameNode) {
    const id = aliasNode.$.FixedRef
    const message = `Alias for Person with ID="${id}" has no latinized name`
    logger.error(message)
    return
  }

  const id = latinNameNode.$.ID
  const namePartNodes = latinNameNode.DocumentedNamePart
  const parts = _.map(getNamePart, namePartNodes)

  const fullName = nameUtils.makeFullName(parts)
  const words = nameUtils.makeWords(fullName)

  return {id, parts, fullName, words}
})

// birth date

function processDate (dateNode) {
  const year = parseInt(dateNode.Year)
  const month = parseInt(dateNode.Month)
  const day = parseInt(dateNode.Day)
  const date = new Date(year, month - 1, day)

  return {year, month, day, date}
}

function processFeature (featureNode) {
  if (featureNode.$.FeatureTypeID !== BIRTH_DATE) return

  const datePeriodNode = featureNode.FeatureVersion.DatePeriod

  // Ignore the fact that both Start and end can be a range.
  // By using Start.From and End.To we use the extremes of the date-period.
  const period = {
    start: datePeriodNode.Start.From,
    end: datePeriodNode.End.To
  }

  return _.mapValues(processDate, period)
}

// profile

function processProfile (profileNode) {
  if (profileNode.$.PartySubTypeID !== INDIVIDUAL) return

  const id = profileNode.$.ID

  const identityNode = profileNode.Identity
  const groupTypesEntries = _.map(processMasterNamePartGroup, identityNode.NamePartGroups.MasterNamePartGroup)
  const groupTypes = new Map(groupTypesEntries)

  const mapCompact = _.flow(_.map, _.compact)

  const getNameParts = processAlias(groupTypes)
  const aliases = mapCompact(getNameParts, identityNode.Alias)

  if (_.isEmpty(aliases)) return

  const birthDatePeriods = mapCompact(processFeature, profileNode.Feature)
  const individual = {id, aliases, birthDatePeriods}

  // debug_log(individual)

  return individual
}

function promiseParseDocument (source) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(source)
    const xml = new XmlStream(stream)

    xml.on('error', err => {
      xml.pause()
      const message = `Error while parsing OFAC data source file (${source}): ${err.message}`
      reject(new Error(message))
    })

    xml.collect('Alias')
    xml.collect('DocumentedName')
    xml.collect('DocumentedNamePart')
    xml.collect('Feature')
    xml.collect('MasterNamePartGroup')

    const individuals = []

    const collectResult = result => result && individuals.push(result)
    xml.on('updateElement: Profile', _.flow(processProfile, collectResult))

    xml.on('end', _.wrap(resolve, individuals))
  })
}

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
  _.mapValues(_.map(_.pick(['value', 'aliasId']))),
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

function parse (sources) {
  return Promise.all(_.map(promiseParseDocument, sources))
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
}

module.exports = {parse}
