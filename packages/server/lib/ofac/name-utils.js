const doubleMetaphone = require('talisman/phonetics/double-metaphone')
const _ = require('lodash/fp')

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
  const phonetics = _.map(makePhonetic, words)
  const pairs = _.zipAll([words, phonetics])
  return _.map(_.zipObject(['value', 'phonetics']), pairs)
}

module.exports = {
  makeFullName,
  makeWords
}
