const _ = require('lodash/fp')

function getBackwardsCompatibleTriggers (triggers) {
  const filtered = _.filter(_.matches({ triggerType: 'volume', cashDirection: 'both' }))(triggers)
  const grouped = _.groupBy(_.prop('requirement'))(filtered)
  return _.mapValues(_.compose(_.get('threshold'), _.minBy('threshold')))(grouped)
}

module.exports = { getBackwardsCompatibleTriggers}