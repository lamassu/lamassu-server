import test from 'ava'
import _ from 'lodash/fp'

import {mapKeyValuesDeep} from '../../lib/migrate-options'

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
