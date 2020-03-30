import * as R from 'ramda'
import React, { memo } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import { Autocomplete, AutocompleteMultiple } from 'src/components/inputs'
import { Checkbox } from 'src/components/inputs/formik'

const sizes = {
  country: 200,
  fiatCurrency: 150,
  languages: 240,
  cryptoCurrencies: 270,
  showRates: 125,
  action: 175
}

const MainForm = memo(({ value, save, auxData, validationSchema }) => {
  const getData = R.path(R.__, auxData)
  const displayCodeArray = R.compose(R.join(', '), R.map(R.path(['code'])))

  return (
    <EditableTable
      name="locale"
      title="Default Settings"
      altTitleColor
      initialValues={{ country: null }}
      enableEdit
      onDelete={() => {}}
      setEditing={() => {}}
      save={save}
      validationSchema={validationSchema}
      data={R.of(value)}
      elements={[
        {
          name: 'country',
          width: sizes.country,
          view: R.path(['display']),
          input: Autocomplete,
          inputProps: { suggestions: getData(['countries']) }
        },
        {
          name: 'fiatCurrency',
          width: sizes.fiatCurrency,
          view: R.path(['code']),
          input: Autocomplete,
          inputProps: { suggestions: getData(['currencies']) }
        },
        {
          name: 'languages',
          width: sizes.languages,
          view: displayCodeArray,
          input: AutocompleteMultiple,
          inputProps: { suggestions: getData(['languages']) }
        },
        {
          name: 'cryptoCurrencies',
          width: sizes.cryptoCurrencies,
          view: displayCodeArray,
          input: AutocompleteMultiple,
          inputProps: { suggestions: getData(['cryptoCurrencies']) }
        },
        {
          name: 'showRates',
          width: sizes.showRates,
          textAlign: 'center',
          view: it => (it ? 'true' : 'false'),
          input: Checkbox
        }
      ]}
    />
  )
})

export default MainForm
