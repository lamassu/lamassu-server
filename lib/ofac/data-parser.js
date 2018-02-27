const fs = require('fs')
const path = require('path')
const util = require('util')
const XmlStream = require('xml-stream')
const nameUtils = require('./name-utils')
const options = require('../options')
const logger = require('../logger')
const _ = require('lodash/fp')

const debug_log = require('../pp')(__filename) // KOSTIS TODO: remove

const OFAC_DATA_DIR = options.ofacDataDir

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
  const words = nameUtils.makeWords(value)
  return {partName, value, words}
})

const isLatin = _.matchesProperty(['$', 'DocNameStatusID'], PRIMARY_LATIN)

const processAlias = _.curry((groupTypes, aliasNode) => {
  if (aliasNode.$.AliasTypeID !== NAME) return

  const getNamePart = processDocumentedNamePart(groupTypes)
  const latinNameNode = _.find(isLatin, aliasNode.DocumentedName)
  if (!latinNameNode) {
    const id = aliasNode.$.FixedRef
    const message = `Alias for Person with ID="${id}" has no latinized name`
    logger.error(message)
    return
  }

  const namePartNodes = latinNameNode.DocumentedNamePart
  const parts = _.map(getNamePart, namePartNodes)

  const fullName = nameUtils.makeFullName(parts)

  return {parts, fullName}
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
  const individual = {aliases, birthDatePeriods}

  debug_log(individual)
  return [id, individual]
}

function promiseParseDocument (source) {
  return new Promise((resolve, reject) => {
    const fileName = path.join(OFAC_DATA_DIR, source)
    const stream = fs.createReadStream(fileName)
    const xml = new XmlStream(stream)

    xml.on('error', err => {
      xml.pause()
      const message = `Error while parsing OFAC data source file (${source}): ${err.message()}`
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

const readdir = util.promisify(fs.readdir)

const combineAndDedupe = _.flow(
  _.flatten,
  _.compact,
  _.uniqBy(_.first),
  _.map(_.last)
)

function parseList () {
  // NOTE: Not sure how you push code updates to existing clients. This problem
  // might pop up if new code is pushed, without re-doing setup.
  if (!OFAC_DATA_DIR) {
    const message = 'The ofacDataDir option has not been set in lamassu.json'
    return Promise.reject(new Error(message))
  }

  return readdir(OFAC_DATA_DIR)
  .then(sources => Promise.all(_.map(promiseParseDocument, sources)))
  .then(combineAndDedupe)
}

module.exports = {parseList}
