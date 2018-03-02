const assert = require('assert')
const parser = require('../../lib/ofac/parsing')

const fs = require('fs')
const path = require('path')
const util = require('util')
const _ = require('lodash/fp')

const randomTmpFileName = () => path.join('/tmp', Math.random().toString())

const writeFile = util.promisify(fs.writeFile)

function makeDataFiles (contents) {
  const fileNames = _.map(randomTmpFileName, Array(contents.length))
  const pairs = _.zip(fileNames, contents)
  return Promise.all(_.map(_.spread(writeFile), pairs))
  .then(() => fileNames)
}


const mapLines = _.flow(_.map, _.join(''))

const partIds = new Map([
  ['lastName',    1520],
  ['firstName',   1521],
  ['middleName',  1522],
  ['maidenName',  1523],
  ['patronymic', 91708],
  ['matronymic', 91709],
  ['nickname',    1528]
])

const getId = part => partIds.get(part.partName)

const makePart = part => '' +
  '\n\t\t\t\t\t<DocumentedNamePart>' +
  `\n\t\t\t\t\t\t<NamePartValue NamePartGroupID="${getId(part)}">` +
    part.value +
    '</NamePartValue>' +
  '\n\t\t\t\t\t</DocumentedNamePart>'

const makeAlias = alias => '' +
  '\n\t\t\t<Alias AliasTypeID="1403">' +
  `\n\t\t\t\t<DocumentedName ID="${alias.id}" DocNameStatusID="1">` +
  _.map(makePart, alias.parts) +
  '\n\t\t\t\t</DocumentedName>' +
  '\n\t\t\t</Alias>'

const makePartGroup = part => '' +
    '\n\t\t\t\t<MasterNamePartGroup>' +
    '\n\t\t\t\t\t<NamePartGroup ' +
      `ID="${getId(part)}" ` +
      `NamePartTypeID="${getId(part)}"/>` +
    '\n\t\t\t\t</MasterNamePartGroup>'

const makePartGroups = alias => mapLines(makePartGroup, alias.parts)

const makeBirthDate = birthDate => '' +
  '\n\t\t<Feature FeatureTypeID="8">' +
  '\n\t\t\t<FeatureVersion>' +
  '\n\t\t\t\t<DatePeriod>' +
  '\n\t\t\t\t\t<Start>' +
  '\n\t\t\t\t\t\t<From>' +
  `\n\t\t\t\t\t\t\t<Year>${birthDate.start.year}</Year>` +
  `\n\t\t\t\t\t\t\t<Month>${birthDate.start.month}</Month>` +
  `\n\t\t\t\t\t\t\t<Day>${birthDate.start.day}</Day>` +
  '\n\t\t\t\t\t\t</From>' +
  '\n\t\t\t\t\t\t<To>' +
  `\n\t\t\t\t\t\t\t<Year>${birthDate.start.year}</Year>` +
  `\n\t\t\t\t\t\t\t<Month>${birthDate.start.month}</Month>` +
  `\n\t\t\t\t\t\t\t<Day>${birthDate.start.day}</Day>` +
  '\n\t\t\t\t\t\t</To>' +
  '\n\t\t\t\t\t</Start>' +
  '\n\t\t\t\t\t<End>' +
  '\n\t\t\t\t\t\t<From>' +
  `\n\t\t\t\t\t\t\t<Year>${birthDate.end.year}</Year>` +
  `\n\t\t\t\t\t\t\t<Month>${birthDate.end.month}</Month>` +
  `\n\t\t\t\t\t\t\t<Day>${birthDate.end.day}</Day>` +
  '\n\t\t\t\t\t\t</From>' +
  '\n\t\t\t\t\t\t<To>' +
  `\n\t\t\t\t\t\t\t<Year>${birthDate.end.year}</Year>` +
  `\n\t\t\t\t\t\t\t<Month>${birthDate.end.month}</Month>` +
  `\n\t\t\t\t\t\t\t<Day>${birthDate.end.day}</Day>` +
  '\n\t\t\t\t\t\t</To>' +
  '\n\t\t\t\t\t</End>' +
  '\n\t\t\t\t</DatePeriod>' +
  '\n\t\t\t</FeatureVersion>' +
  '\n\t\t</Feature>'

const makeProfile = profile => {
  console.log(profile.birthDates)
  return '' +
    `\n\t<Profile ID="${profile.id}" PartySubTypeID="4">` +
    '\n\t\t<Identity>' +
    mapLines(makeAlias, profile.aliases) +
    '\n\t\t\t<NamePartGroups>' +
    mapLines(makePartGroups, profile.aliases) +
    '\n\t\t\t</NamePartGroups>' +
    '\n\t\t</Identity>' +
    mapLines(makeBirthDate, profile.birthDates) +
    '\n\t</Profile>'
}

const makeXml = profiles => '<?xml version="1.0" encoding="utf-8"?>' +
  '\n<doc>' +
  mapLines(makeProfile, profiles) +
  '\n</doc>'


describe('OFAC', function () {
  describe('Parsing', function () {

    // To detect botched downloads
    it('should fail on malformed XML', function () {
      const xml = '<a><b></a>'
      return makeDataFiles([xml]).then(parser.parse)
      .catch(error => {
        assert.ok(error instanceof Error)
        return true
      })
      .then(ret => {
        assert.equal(ret, true)
      })
    })

    it('should return the expected structs', function () {
      const xml = makeXml([{
        id: '1', aliases: [{
          id: '1',
          parts: [
            {partName: 'firstName', value: 'John'},
            {partName: 'lastName', value: 'Doe'}]
        }],
        birthDates: [{
          start: {year: 1955, month: 10, day: 5},
          end: {year: 1955, month: 10, day: 5}
        }]
      }])
      return makeDataFiles([xml]).then(parser.parse)
      .then(structs => {
        const {individuals} = structs
        assert.ok(Array.isArray(individuals))
        assert.equal(individuals.length, 1)

        const {individualsMap} = structs
        assert.ok(individualsMap instanceof Map)
        assert.equal(individualsMap.size, 1)

        const {aliasToIndividual} = structs
        assert.ok(aliasToIndividual instanceof Map)
        assert.equal(aliasToIndividual.size, 1)

        const {phoneticMap} = structs
        assert.ok(phoneticMap instanceof Map)
        assert.equal(phoneticMap.size, 3)

        const {wordList} = structs
        assert.ok(Array.isArray(wordList))
        assert.equal(wordList.length, 2)
      })
    })

    it('should be able to parse multiple sources')

    it('should remove duplicates from multiple sources')

  })
})
