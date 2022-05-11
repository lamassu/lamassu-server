import test from 'ava'
import _ from 'lodash/fp'
import settings from '../../db.json'

import configManager from '../../lib/new-config-manager'

const machineId = '9682f15e40539e40d3e4050a993cf74e3e157d6d9b7866fb1ebd5206024ae68a'
const config = settings.config

test('first examples', () => {
  const triggers = configManager.getTriggers(config)
  const filtered = _.filter(_.matches({ triggerType: 'volume', direction: 'both' }))(triggers)
  const grouped = _.groupBy(_.prop('requirement'))(filtered)
  const final = _.mapValues(_.compose(_.get('threshold'), _.minBy('threshold')))(grouped)

  console.log(final)
})