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
    start: {year: 1955, month: 10, day: 5},
    end: {year: 1955, month: 10, day: 5}}]
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
    start: {year: 1965, month: 11, day: 20},
    end: {year: 1965, month: 11, day: 20}}]
}


const parseIndividuals = source => {
  const individuals = []

  return new Promise((resolve, reject) => {
    parser.parse(source, (err, profile) => {
      if (err) {
        reject(err)
        return
      }

      if (!profile) {
        resolve(individuals)
        return
      }

      individuals.push(profile)
    })
  })
}


describe('OFAC', function () {
  describe('Parsing', function () {

    // To detect botched downloads
    it('should fail on malformed XML', function () {
      const xml = '<a><b></a>'
      return makeDataFiles([xml])
      .then(files => Promise.all(_.map(parseIndividuals, files)))
      .catch(error => {
        assert.ok(error instanceof Error)
        return 'failed'
      })
      .then(ret => {
        assert.equal(ret, 'failed')
      })
    })

    it('should return the expected individuals', function () {
      const xml = makeXml([individualA, individualB])

      return makeDataFiles([xml])
      .then(files => Promise.all(_.map(parseIndividuals, files)))
      .then(([individuals]) => {
        assert.ok(Array.isArray(individuals))
        assert.equal(individuals.length, 2)
        assert.deepEqual(individuals, [individualA, individualB])
      })
    })

  })
})
