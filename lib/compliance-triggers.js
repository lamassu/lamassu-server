const _ = require('lodash/fp')

function getBackwardsCompatibleTriggers (triggers) {
  const filtered = _.filter(_.matches({ triggerType: 'txVolume', direction: 'both', thresholdDays: 1 }))(triggers)
  const grouped = _.groupBy(_.prop('requirement'))(filtered)
  return _.mapValues(_.compose(_.get('threshold'), _.minBy('threshold')))(grouped)
}

function hasSanctions (triggers) {
  return _.some(_.matches({ requirement: 'sanctions' }))(triggers)
}

function maxDaysThreshold (triggers) {
  return _.max(_.map('thresholdDays')(triggers))
}

function getCashLimit (triggers) {
  const withFiat = _.filter(({ triggerType }) => _.includes(triggerType, ['txVolume', 'txAmount']))
  const blocking = _.filter(({ requirement }) => _.includes(requirement, ['block', 'suspend']))
  return _.compose(_.minBy('threshold'), blocking, withFiat)(triggers)
}

const hasRequirement = requirement => _.compose(_.negate(_.isEmpty), _.find(_.matches({ requirement })))

const hasPhone = hasRequirement('sms')
const hasFacephoto = hasRequirement('facephoto')
const hasIdScan = hasRequirement('idCardData')

module.exports = { getBackwardsCompatibleTriggers, hasSanctions, maxDaysThreshold, getCashLimit, hasPhone, hasFacephoto, hasIdScan }