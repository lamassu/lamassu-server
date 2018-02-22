const metaphone = require('talisman/phonetics/metaphone')
const doubleMetaphone = require('talisman/phonetics/double-metaphone')
const _ = require('lodash/fp')

// KOSTIS TODO: Decide on a method. Remove the others

const phoneticMethod1 = metaphone

const phoneticMethod2 = _.flow(doubleMetaphone, _.uniq)

const phoneticMethod3 = _.flow(_.split(' '), _.map(phoneticMethod2))

// Combine name-parts in a standard order.

const commonOrderings = [
  ['firstName', 'lastName'],
  ['firstName', 'middleName', 'lastName'],
  ['firstName', 'maidenName', 'lastName'],
  ['firstName', 'patronymic', 'lastName'],
  ['firstName', 'matronymic', 'lastName']
]

// const getFrom = _.flip()

const getFrom = _.curry((obj, key) => obj[key])

const getOrderedParts = (parts, ordering) => _.map(getFrom(parts), ordering)

const combineParts = _.curryN(2, _.flow(
  getOrderedParts,
  _.compact,
  _.join(' ')
))

const makeAllOrderings = parts => _.map(combineParts(parts), commonOrderings)

const makeFullNames = _.flow(
  makeAllOrderings,
  _.uniq
)


module.exports = {
  makeFullNames,
  phonetic: phoneticMethod3
}
