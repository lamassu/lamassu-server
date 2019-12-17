import React, { memo } from 'react'
import * as R from 'ramda'

import { Autocomplete, AutocompleteMultiple } from '../../components/inputs'

import { Checkbox } from '../../components/inputs/formik'

// import styles from './MainForm.module.scss'
import { Table as EditableTable } from '../../components/editableTable'

const sizes = {
  country: 200,
  fiatCurrency: 150,
  languages: 240,
  cryptoCurrencies: 270,
  showRates: 125,
  action: 175
}

const MainForm = memo(
  ({ value, save, auxData, validationSchema }) => {
    const getData = R.path(R.__, auxData)
    const displayCodeArray = R.compose(R.join(', '), R.map(R.path(['code'])), R.of)

    return (
      <EditableTable
        save={save}
        validationSchema={validationSchema}
        data={R.of(value)}
        elements={[
          {
            name: 'country',
            size: sizes.country,
            view: R.path(['display']),
            input: Autocomplete,
            inputProps: { suggestions: getData(['countries']) }
          },
          {
            name: 'fiatCurrency',
            size: sizes.fiatCurrency,
            view: R.path(['code']),
            input: Autocomplete,
            inputProps: { suggestions: getData(['currencies']) }
          },
          {
            name: 'languages',
            size: sizes.languages,
            view: displayCodeArray,
            input: AutocompleteMultiple,
            inputProps: { suggestions: getData(['languages']) }
          },
          {
            name: 'cryptoCurrencies',
            size: sizes.cryptoCurrencies,
            view: () => {},//displayCodeArray,
            input: AutocompleteMultiple,
            inputProps: { suggestions: getData(['cryptoCurrencies']) }
          },
          {
            name: 'showRates',
            size: sizes.showRates,
            textAlign: 'center',
            view: it => it ? 'true' : 'false',
            input: Checkbox
          }
        ]}
      />
    )
  }
)

export default MainForm
