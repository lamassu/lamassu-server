import test from 'ava'
import _ from 'lodash/fp'
import path from 'path'

import {mapKeyValuesDeep, updateOptionBasepath} from '../../lib/migrate-options'

const currentBasePath = path.dirname(path.dirname(__dirname))

test('mapKeyValuesDeep', t => {
  const test = {
    a: {
      b: 1
    },
    c: [
      {
        d: 2,
        e: 3
      }
    ],
    f: {
      g: {
        h: [
          {
            i: 4
          }
        ]
      }
    }
  }
  const expected = [{b: 1}, {d: 2}, {e: 3}, {i: 4}]

  const result = []
  mapKeyValuesDeep((v, k) => {
    result.push(_.fromPairs([[k, v]]))
  }, test)

  t.deepEqual(result, expected)
})

test('updateOptionBasepath', t => {
  const test = {
    someBooleanOption: true,
    someStringOption: 'my-custom-option',
    customExternalPath: '/usr/lib/node_modules/ava',
    seedPath: '/etc/lamassu/seeds/seed.txt',
    caPath: '/usr/lib/node_modules/lamassu-server/certs/Lamassu_OP_Root_CA.pem'
  }
  const expected = {
    someBooleanOption: true,
    someStringOption: 'my-custom-option',
    customExternalPath: '/usr/lib/node_modules/ava',
    seedPath: '/etc/lamassu/seeds/seed.txt',
    caPath: path.join(currentBasePath, 'certs/Lamassu_OP_Root_CA.pem')
  }

  let result = _.clone(test)

  _.each(
    _.wrap(updateOptionBasepath, result),
    _.keys(test)
  )

  t.deepEqual(result, expected)
})
