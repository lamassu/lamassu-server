const assert = require('assert')
const ofac = require('../../lib/ofac')
const _ = require('lodash/fp')

let structs
let fullNames

const rand = N => _.random(0, N - 1)

const duplicate = (word, index) => {
  const c = word[index]
  return _.join('', [word.slice(0, index), c, c, word.slice(index + 1)])
}

const remove = (word, index) => {
  return _.join('', [word.slice(0, index), word.slice(index + 1)])
}

const transpose = (word, index) => {
  const a = word[index]
  const b = word[index + 1] || ' '
  return _.join('', [word.slice(0, index), b, a, word.slice(index + 2)])
}

const alter = (word, index) => {
  const c = word.charCodeAt(index)
  const o = c - 'a'.charCodeAt(0)
  const oo = (o + _.random(1, 26)) % 26
  const cc = String.fromCharCode(oo + 'a'.charCodeAt(0))
  return _.join('', [word.slice(0, index), cc, word.slice(index + 1)])
}

const misspellOps = [
  duplicate,
  remove,
  transpose,
  alter
]

const misspell = word => {
  const len = word.length
  const index = _.random(1, len)
  const operation = _.sample(misspellOps)
  return operation(word, index)
}

const misspellRandomly = word => {
  const len = word.length
  const num = _.random(1, Math.sqrt(len))
  return _.flow(..._.times(() => misspell, num))(word)
}

describe('OFAC', function () {
  describe('Matching', function () {

    before(function () {
      this.timeout(60000)
      return ofac.load()
        .then(result => {
          structs = result
          const {individuals} = structs
          fullNames = _.flow(
            _.flatMap('aliases'),
            _.map('fullName')
          )(individuals)
        })
    })

    it('should match the exact full names of suspects', function () {
      this.timeout(0)

      for (const fullName of fullNames) {
        const matches = ofac.match({firstName: fullName}, null, 1)
        assert.ok(matches.length > 0)
      }
    })

    it('should match the permutated full names of suspects', function () {
      this.timeout(0)

      for (const fullName of fullNames) {
        const reversed = _.flow(
          _.split(' '),
          _.reverse,
          _.join(' ')
        )(fullName)

        const matches = ofac.match({firstName: reversed}, null, 1)
        assert.ok(matches.length > 0)
      }
    })

    it('should match despite some misspellings', function () {
      this.timeout(0)
      this.retries(4)

      for (const fullName of fullNames) {
        const lightlyMisspelled = misspell(fullName)

        const heavilyMisspelled = _.flow(
          _.split(' '),
          _.map(misspell),
          _.join(' ')
        )(fullName)

        console.log(fullName, '|', lightlyMisspelled, '|', heavilyMisspelled)

        const matchesA = ofac.match({firstName: lightlyMisspelled}, null, 0.95)
        assert.ok(matchesA.length > 0)

        const matchesB = ofac.match({firstName: heavilyMisspelled}, null, 0.85)
        assert.ok(matchesB.length > 0)
      }
    })

    it('should match phonetically similar words', function () {
      this.timeout(0)
      this.retries(4)

      for (const fullName of fullNames) {
        const lightlyMisspelled = misspell(fullName)

        const heavilyMisspelled = _.flow(
          _.split(' '),
          _.map(misspell),
          _.join(' ')
        )(fullName)

        console.log(fullName, '|', lightlyMisspelled, '|', heavilyMisspelled)

        const matchesA = ofac.match({firstName: lightlyMisspelled}, null, 1)
        assert.ok(matchesA.length > 0)
      }
    })

    it('should match names that are only a single word')

    it('should discard matches with inapropriate birthdates')

  })
})
