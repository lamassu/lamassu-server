const metaphone = require('talisman/phonetics/metaphone')
const doubleMetaphone = require('talisman/phonetics/double-metaphone')
const _ = require('lodash/fp')

// KOSTIS TODO: Decide on a method. Remove the others

const phoneticMethod1 = metaphone

const phoneticMethod2 = _.flow(doubleMetaphone, _.uniq)

const phoneticMethod3 = _.flow(_.split(' '), _.map(phoneticMethod2))

// Combine name-parts in a standared order.

const fullNameFromParts = _.flow(
  _.toPairs,
  _.sortBy(_.nth(0)), // sort by part name,
  _.map(_.nth(1)), // get part value
  _.join(' ')
)

module.exports = {
  fullNameFromParts,
  phonetic: phoneticMethod3
}
