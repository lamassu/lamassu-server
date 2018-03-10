import test from 'ava'

import settingsLoader from '../../lib/settings-loader'

test('simple merge', t => {
  const fieldCode = 'testCode'
  const fieldLocator = {fieldScope: {crypto: 'global', machine: 'global'}, code: fieldCode}
  const fieldValueA = {fieldType: 'percentage', value: 5}
  const fieldValueB = {fieldType: 'percentage', value: 6}
  const merged = settingsLoader.mergeValues(
    [{fieldLocator, fieldValue: fieldValueA}],
    [{fieldLocator, fieldValue: fieldValueB}]
  )
  t.deepEqual(merged, [{fieldLocator, fieldValue: fieldValueB}])
})

test('bigger merge', t => {
  const fieldCode = 'testCode'
  const fieldLocator1 = {fieldScope: {crypto: 'BTC', machine: 'xx'}, code: fieldCode}
  const fieldLocator2 = {fieldScope: {crypto: 'global', machine: 'global'}, code: fieldCode}
  const fieldLocator3 = {fieldScope: {crypto: 'BTC', machine: 'xx'}, code: 'testCode2'}
  const fieldLocator4 = {fieldScope: {crypto: 'BTC', machine: 'xx'}, code: 'testCode3'}

  const fieldValue1 = {fieldType: 'percentage', value: 1}
  const fieldValue2 = {fieldType: 'percentage', value: 2}
  const fieldValue3 = {fieldType: 'percentage', value: 3}
  const fieldValue4 = {fieldType: 'percentage', value: 4}
  const fieldValue5 = {fieldType: 'percentage', value: 5}

  const merged = settingsLoader.mergeValues(
    [
      {fieldLocator: fieldLocator1, fieldValue: fieldValue1},
      {fieldLocator: fieldLocator2, fieldValue: fieldValue2},
      {fieldLocator: fieldLocator3, fieldValue: fieldValue3}
    ],
    [
      {fieldLocator: fieldLocator1, fieldValue: fieldValue4},
      {fieldLocator: fieldLocator4, fieldValue: fieldValue5}
    ]
  )

  const expected = [
    {fieldLocator: fieldLocator1, fieldValue: fieldValue4},
    {fieldLocator: fieldLocator4, fieldValue: fieldValue5},
    {fieldLocator: fieldLocator2, fieldValue: fieldValue2},
    {fieldLocator: fieldLocator3, fieldValue: fieldValue3}
  ]

  t.deepEqual(merged, expected)
})
