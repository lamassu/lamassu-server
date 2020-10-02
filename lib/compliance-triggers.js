const _ = require('lodash/fp')

function getBackwardsCompatibleTriggers (triggers) {
  const filtered = _.filter(_.matches({ triggerType: 'txVolume', direction: 'both', thresholdDays: 1 }))(triggers)
  const grouped = _.groupBy(_.prop('requirement'))(filtered)
  return _.mapValues(_.compose(_.get('threshold'), _.minBy('threshold')))(grouped)
}

function hasSanctions (triggers) {
  return _.some(_.matches({ requirement: 'sanctions' }))(triggers)
}

module.exports = { getBackwardsCompatibleTriggers, hasSanctions }