const fs = require('fs')
const path = require('path')
const XmlStream = require('xml-stream')
const jaroWinkler = require('talisman/metrics/distance/jaro-winkler')
const metaphone = require('talisman/phonetics/metaphone')
const options = require('../options')
const logger = require('../logger')
const _ = require('lodash/fp')

// PARSING

const OFAC_DATA_DIR = options.ofacDataDir

// TODO: get these from the document itself
const INDIVIDUAL = '4'
const NAME = '1403'
const BIRTH_DATE = '8'

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

// TODO: get this from admin configuration
const SIMILARITY_THRESHOLD = 0.5

// TODO: remove
const debug_log = (...args) => console.log(require('util').inspect(args, {depth: null, colors: true}))

let individuals = []
const individualsById = new Map()

// group-id to type-id

function processMasterNamePartGroup (groupNode) {
  const namePartGroupNode = groupNode.NamePartGroup
  const groupId = namePartGroupNode.$.ID
  const typeId = namePartGroupNode.$.NamePartTypeID
  return [groupId, typeId]
}

// name parts

function makeFullNameFromParts (nameParts) {
  // Combine name-parts in a standared order.
  const namePartPairs = _.toPairs(nameParts)
  const sortedPairs = _.sortBy(_.nth(0), namePartPairs)
  return _.map(_.nth(1), sortedPairs).join(' ')
}

function makePhonetic (name) {
  return metaphone(name)
}

function processDocumentedNamePart (groupTypes) {
  return function (namePartNode) {
    const valueNode = namePartNode.NamePartValue
    const groupId = valueNode.$.NamePartGroupID
    const typeId = groupTypes.get(groupId)
    const partName = partNames.get(typeId)
    const value = valueNode.$text
    return {[partName]: value}
  }
}

function processAlias (groupTypes) {
  return function (aliasNode) {
    if (aliasNode.$.AliasTypeID !== NAME) return

    const nameParts = _.map(processDocumentedNamePart(groupTypes), aliasNode.DocumentedName.DocumentedNamePart)
    const parts = _.assignAll(nameParts)
    const fullName = makeFullNameFromParts(parts)

    const phoneticParts = _.mapValues(makePhonetic, parts)
    const phoneticFullName = makePhonetic(fullName)

    return {parts, fullName, phoneticParts, phoneticFullName}
  }
}

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

  const aliases = _.compact(_.map(processAlias(groupTypes), identityNode.Alias))
  const birthDatePeriods = _.compact(_.map(processFeature, profileNode.Feature))
  const individual = {aliases, birthDatePeriods}

  individualsById.set(id, individual)
  debug_log(individual)
}

function promiseParseDocument (source) {
  return new Promise(resolve => {
    const fileName = path.join(OFAC_DATA_DIR, source)
    const stream = fs.createReadStream(fileName)
    const xml = new XmlStream(stream)

    xml.on('error', error => {
      logger.error('Error while parsing the OFAC data sources.')
      logger.error(error)
      xml.pause()
      resolve()
    })

    xml.collect('Alias')
    xml.collect('DocumentedNamePart')
    xml.collect('Feature')
    xml.collect('MasterNamePartGroup')

    xml.on('updateElement: Profile', processProfile)

    xml.on('end', resolve)
  })
}

function load () {
  // NOTE: Not sure how you push code updates to existing clients. This problem
  // might pop up if new code is pushed, without re-doing setup.
  if (!OFAC_DATA_DIR) {
    logger.error('The ofacDataDir option has not been set in lamassu.json')
    return
  }

  individualsById.clear()

  const sources = fs.readdirSync(OFAC_DATA_DIR)
  const promises = _.map(promiseParseDocument, sources)

  return Promise.all(promises)
    .then(() => {
      individuals = Array.from(individualsById.values())
    })
}

// MATCHING

// birth date

function isDateWithinTwoYearsOfPeriod (targetDate) {
  return function (period) {
    const startDate = new Date(period.from.date)
    const startYear = startDate.getFullYear()
    startDate.setFullYear(startYear - 2)

    const endDate = new Date(period.to.date)
    const endYear = endDate.getFullYear()
    endDate.setFullYear(endYear + 2)

    return (startDate < targetDate && targetDate < endDate)
  }
}

function isBornWithinTwoYears (individual, dateObject) {
  return _.some(isDateWithinTwoYearsOfPeriod(dateObject.date), individual.birthDatePeriods)
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

function doesMatch (nameParts, fullName, phoneticParts, phoneticFullName, birthDate) {
  return function (individual) {
    // Calculate if his birth date is within two years of the given date.
    // If an individual has multiple birth-date periods, return wether any are
    // within two years. Reject individuals who don't match this criterion.
    if (individual.birthDatePeriods.length && !isBornWithinTwoYears(individual, birthDate)) return false

    // Calculate the Jaro-Winkler similarity of the full name.
    // If an individual has multiple aliases, use the maximum score.
    const exactMatchScore = _.max(_.map(calcExactMatchScore(fullName), individual.aliases))

    if (exactMatchScore > SIMILARITY_THRESHOLD) return true

    // Calculate the Jaro-Winkler similarity of the phonetic representation of the full name.
    // This should approximate the phonetic similarity of the two names.
    // If an individual has multiple aliases, use the maximum score.
    const phoneticMatchScore = _.max(_.map(calcPhoneticMatchScore(phoneticFullName), individual.aliases))

    if (phoneticMatchScore > SIMILARITY_THRESHOLD) return true

    return false
  }
}

function match (nameParts, birthDateString) {
  // nameParts should be an object like {firstName: "John", lastName: "Doe", ...}
  const fullName = makeFullNameFromParts(nameParts)

  const phoneticParts = _.mapValues(makePhonetic, nameParts)
  const phoneticFullName = makePhonetic(fullName)

  // birthDateString is in YYYYMMDD format
  const year = parseInt(birthDateString.slice(0, 4))
  const month = parseInt(birthDateString.slice(4, 6))
  const day = parseInt(birthDateString.slice(6, 8))
  const date = new Date(year, month - 1, day)

  const birthDate = {year, month, day, date}

  return _.some(doesMatch(nameParts, fullName, phoneticParts, phoneticFullName, birthDate), individuals)
}

module.exports = {load, match}
