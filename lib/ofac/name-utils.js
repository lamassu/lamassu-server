const doubleMetaphone = require('talisman/phonetics/double-metaphone')
const _ = require('lodash/fp')

// KOSTIS TODO: Decide on a method. Remove the others

const makePhonetic = _.flow(doubleMetaphone, _.uniq)

// Combine name-parts in a standard order.

const partOrdering = ['firstName', 'middleName', 'maidenName', 'patronymic', 'matronymic', 'lastName']

const usingPartOrder = _.flow(
  _.get('partName'),
  _.partialRight(_.indexOf, [partOrdering])
)

const makeFullName = _.flow(
  _.sortBy(usingPartOrder),
  _.map(_.get('value')),
  _.join(' ')
)

const makeWords = value => {
  const words = _.split(' ', value)
  const phonetic = _.map(makePhonetic, words)
  const props = _.zipAll([words, phonetic])
  return _.map(_.zipObject(['value', 'phonetic']), props)
}

module.exports = {
  makeFullName,
  makeWords
}
