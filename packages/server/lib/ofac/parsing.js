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

const filteredWords = [
  // 'al'
]

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
  const words = _.flow(
    nameUtils.makeWords,
    _.reject(_.flow(
      _.get('value'),
      word => filteredWords.includes(word)
    ))
  )(fullName)

  // if (words.length < 2) {
  //   console.log(JSON.stringify(words))
  // }

  return {id, parts, fullName, words}
})

// birth date

function processDate (dateNode) {
  const year = parseInt(dateNode.Year)
  const month = parseInt(dateNode.Month)
  const day = parseInt(dateNode.Day)
  return {year, month, day}
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

const parse = (source, callback) => {
  const stream = fs.createReadStream(source)
  const xml = new XmlStream(stream)

  xml.on('error', err => {
    xml.pause()
    const message = `Error while parsing OFAC data source file (${source}): ${err.message}`
    callback(new Error(message))
  })

  xml.collect('Alias')
  xml.collect('DocumentedName')
  xml.collect('DocumentedNamePart')
  xml.collect('Feature')
  xml.collect('MasterNamePartGroup')

  const forwardProfile = profile => profile && callback(null, profile)

  xml.on('updateElement: Profile', _.flow(processProfile, forwardProfile))

  xml.on('end', () => {
    callback(null, null)
  })
}

module.exports = {parse}
