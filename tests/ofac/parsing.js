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
`					<DocumentedNamePart>
						<NamePartValue NamePartGroupID="${getId(part)}">${part.value}</NamePartValue>
					</DocumentedNamePart>`

const makeAlias = alias => '' +
`			<Alias AliasTypeID="1403">
				<DocumentedName ID="${alias.id}" DocNameStatusID="1">
${_.map(makePart, alias.parts)}
				</DocumentedName>
			</Alias>`

const makePartGroup = part => '' +
`				<MasterNamePartGroup>
					<NamePartGroup
						ID="${getId(part)}"
						NamePartTypeID="${getId(part)}"/>
				</MasterNamePartGroup>`

const makePartGroups = alias => mapLines(makePartGroup, alias.parts)

const makeBirthDate = birthDate => '' +
`		<Feature FeatureTypeID="8">
			<FeatureVersion>
				<DatePeriod>
					<Start>
						<From>
							<Year>${birthDate.start.year}</Year>
							<Month>${birthDate.start.month}</Month>
							<Day>${birthDate.start.day}</Day>
						</From>
						<To>
							<Year>${birthDate.start.year}</Year>
							<Month>${birthDate.start.month}</Month>
							<Day>${birthDate.start.day}</Day>
						</To>
					</Start>
					<End>
						<From>
							<Year>${birthDate.end.year}</Year>
							<Month>${birthDate.end.month}</Month>
							<Day>${birthDate.end.day}</Day>
						</From>
						<To>
							<Year>${birthDate.end.year}</Year>
							<Month>${birthDate.end.month}</Month>
							<Day>${birthDate.end.day}</Day>
						</To>
					</End>
				</DatePeriod>
			</FeatureVersion>
		</Feature>`

const makeProfile = profile => {
  console.log(profile.birthDatePeriods)
  return '' +
` <Profile ID="${profile.id}" PartySubTypeID="4">
		<Identity>
${mapLines(makeAlias, profile.aliases)}
			<NamePartGroups>
${mapLines(makePartGroups, profile.aliases)}
			</NamePartGroups>
		</Identity>
${mapLines(makeBirthDate, profile.birthDatePeriods)}
	</Profile>`
}

const makeXml = profiles => '' +
`<?xml version="1.0" encoding="utf-8"?>
<doc>
${mapLines(makeProfile, profiles)}
</doc>`


const individualA = {id: '9', aliases: [{id: '5',
  parts: [
    {partName: 'firstName', value: 'john'},
    {partName: 'lastName', value: 'doe'}],
  fullName: 'john doe',
  words: [
    {value: 'john', phonetics: ['JN', 'AN']},
    {value: 'doe', phonetics: ['T']}]}],
  birthDatePeriods: [{
    start: {year: 1955, month: 10, day: 5, date: new Date(1955, 9, 5)},
    end: {year: 1955, month: 10, day: 5, date: new Date(1955, 9, 5)}}]
}

const individualB = {id: '11', aliases: [{id: '15',
  parts: [
    {partName: 'firstName', value: 'john'},
    {partName: 'middleName', value: 'de'},
    {partName: 'lastName', value: 'gaul'}],
  fullName: 'john de gaul',
  words: [
    {value: 'john', phonetics: ['JN', 'AN']},
    {value: 'de', phonetics: ['T']},
    {value: 'gaul', phonetics: ['KL']}]}],
  birthDatePeriods: [{
    start: {year: 1965, month: 11, day: 20, date: new Date(1965, 10, 20)},
    end: {year: 1965, month: 11, day: 20, date: new Date(1965, 10, 20)}}]
}


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
      const xml = makeXml([individualA])

      return makeDataFiles([xml]).then(parser.parse)
      .then(structs => {
        const {individuals} = structs
        assert.ok(Array.isArray(individuals))
        assert.equal(individuals.length, 1)
        assert.deepEqual(individuals[0], individualA)

        const {individualsMap} = structs
        assert.ok(individualsMap instanceof Map)
        assert.equal(individualsMap.size, 1)
        assert.ok(individualsMap.has('9'))
        assert.deepEqual(individualsMap.get('9'), individualA)

        const {aliasToIndividual} = structs
        assert.ok(aliasToIndividual instanceof Map)
        assert.equal(aliasToIndividual.size, 1)
        assert.ok(aliasToIndividual.has('5'))
        assert.strictEqual(aliasToIndividual.get('5'), '9')

        const {phoneticMap} = structs
        assert.ok(phoneticMap instanceof Map)
        assert.equal(phoneticMap.size, 3)
        assert.ok(phoneticMap.has('JN'))
        assert.deepEqual(phoneticMap.get('JN'), [{value: 'john', aliasId: '5'}])
        assert.ok(phoneticMap.has('AN'))
        assert.deepEqual(phoneticMap.get('AN'), [{value: 'john', aliasId: '5'}])
        assert.ok(phoneticMap.has('T'))
        assert.deepEqual(phoneticMap.get('T'), [{value: 'doe', aliasId: '5'}])

        const {wordList} = structs
        assert.ok(Array.isArray(wordList))
        assert.equal(wordList.length, 2)
        assert.deepEqual(wordList[0], {value: 'john', aliasIds: ['5']})
        assert.deepEqual(wordList[1], {value: 'doe', aliasIds: ['5']})
      })
    })

    it('should be able to combine multiple sources', function () {
      const xmlA = makeXml([individualA])
      const xmlB = makeXml([individualB])

      return makeDataFiles([xmlA, xmlB]).then(parser.parse)
      .then(structs => {
        const {individuals} = structs
        assert.ok(Array.isArray(individuals))
        assert.equal(individuals.length, 2)
        assert.deepEqual(individuals[0], individualA)
        assert.deepEqual(individuals[1], individualB)

        const {individualsMap} = structs
        assert.ok(individualsMap instanceof Map)
        assert.equal(individualsMap.size, 2)
        assert.ok(individualsMap.has('9'))
        assert.deepEqual(individualsMap.get('9'), individualA)
        assert.ok(individualsMap.has('11'))
        assert.deepEqual(individualsMap.get('11'), individualB)

        const {aliasToIndividual} = structs
        assert.ok(aliasToIndividual instanceof Map)
        assert.equal(aliasToIndividual.size, 2)
        assert.ok(aliasToIndividual.has('5'))
        assert.strictEqual(aliasToIndividual.get('5'), '9')
        assert.ok(aliasToIndividual.has('15'))
        assert.strictEqual(aliasToIndividual.get('15'), '11')

        const {phoneticMap} = structs
        assert.ok(phoneticMap instanceof Map)
        assert.equal(phoneticMap.size, 4)
        assert.ok(phoneticMap.has('JN'))
        assert.deepEqual(phoneticMap.get('JN'), [
          {value: 'john', aliasId: '5'},
          {value: 'john', aliasId: '15'}
        ])
        assert.ok(phoneticMap.has('AN'))
        assert.deepEqual(phoneticMap.get('AN'), [
          {value: 'john', aliasId: '5'},
          {value: 'john', aliasId: '15'}
        ])
        assert.ok(phoneticMap.has('T'))
        assert.deepEqual(phoneticMap.get('T'), [
          {value: 'doe', aliasId: '5'},
          {value: 'de', aliasId: '15'}
        ])

        const {wordList} = structs
        assert.ok(Array.isArray(wordList))
        assert.equal(wordList.length, 4)
        assert.deepEqual(wordList[0], {value: 'john', aliasIds: ['5', '15']})
        assert.deepEqual(wordList[1], {value: 'doe', aliasIds: ['5']})
        assert.deepEqual(wordList[2], {value: 'de', aliasIds: ['15']})
        assert.deepEqual(wordList[3], {value: 'gaul', aliasIds: ['15']})
      })
    })

    it('should remove duplicates from multiple sources', function () {
      const xmlA1 = makeXml([individualA, individualA])
      const xmlA2 = makeXml([individualA])

      return makeDataFiles([xmlA1, xmlA2]).then(parser.parse)
      .then(structs => {
        const {individuals} = structs
        assert.ok(Array.isArray(individuals))
        assert.equal(individuals.length, 1)
        assert.deepEqual(individuals[0], individualA)

        const {individualsMap} = structs
        assert.ok(individualsMap instanceof Map)
        assert.equal(individualsMap.size, 1)
        assert.ok(individualsMap.has('9'))
        assert.deepEqual(individualsMap.get('9'), individualA)

        const {aliasToIndividual} = structs
        assert.ok(aliasToIndividual instanceof Map)
        assert.equal(aliasToIndividual.size, 1)
        assert.ok(aliasToIndividual.has('5'))
        assert.strictEqual(aliasToIndividual.get('5'), '9')

        const {phoneticMap} = structs
        assert.ok(phoneticMap instanceof Map)
        assert.equal(phoneticMap.size, 3)
        assert.ok(phoneticMap.has('JN'))
        assert.deepEqual(phoneticMap.get('JN'), [{value: 'john', aliasId: '5'}])
        assert.ok(phoneticMap.has('AN'))
        assert.deepEqual(phoneticMap.get('AN'), [{value: 'john', aliasId: '5'}])
        assert.ok(phoneticMap.has('T'))
        assert.deepEqual(phoneticMap.get('T'), [{value: 'doe', aliasId: '5'}])

        const {wordList} = structs
        assert.ok(Array.isArray(wordList))
        assert.equal(wordList.length, 2)
        assert.deepEqual(wordList[0], {value: 'john', aliasIds: ['5']})
        assert.deepEqual(wordList[1], {value: 'doe', aliasIds: ['5']})
      })
    })

  })
})
