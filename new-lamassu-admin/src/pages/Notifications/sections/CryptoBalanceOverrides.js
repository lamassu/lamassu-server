import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { transformNumber } from 'src/utils/number'

import NotificationsCtx from '../NotificationsContext'

const HIGH_BALANCE_KEY = 'highBalance'
const LOW_BALANCE_KEY = 'lowBalance'
const CRYPTOCURRENCY_KEY = 'cryptoCurrency'
const NAME = 'cryptoBalanceOverrides'

const CryptoBalanceOverrides = ({ section }) => {
  const {
    cryptoCurrencies = [],
    data,
    save,
    error,
    currency,
    isDisabled,
    setEditing
  } = useContext(NotificationsCtx)
  const setupValues = data?.cryptoBalanceOverrides ?? []
  const innerSetEditing = it => setEditing(NAME, it)

  const onDelete = id => {
    const newOverrides = {
      cryptoBalanceOverrides: R.reject(it => it.id === id, setupValues)
    }
    return save(newOverrides)
  }

  const overridenCryptos = R.map(R.prop(CRYPTOCURRENCY_KEY))(setupValues)
  const suggestionFilter = R.filter(
    it => !R.contains(it.code, overridenCryptos)
  )
  const suggestions = suggestionFilter(cryptoCurrencies)

  const findSuggestion = it => {
    const coin = R.compose(R.find(R.propEq('code', it?.cryptoCurrency)))(
      cryptoCurrencies
    )
    return coin ? [coin] : []
  }

  const initialValues = {
    [CRYPTOCURRENCY_KEY]: null,
    [LOW_BALANCE_KEY]: '',
    [HIGH_BALANCE_KEY]: ''
  }

  const notesMin = 0
  const currencyMax = 9999999
  const validationSchema = Yup.object().shape(
    {
      [CRYPTOCURRENCY_KEY]: Yup.string()
        .label('Cryptocurrency')
        .nullable()
        .required(),
      [LOW_BALANCE_KEY]: Yup.number()
        .label('Low Balance')
        .when(HIGH_BALANCE_KEY, {
          is: HIGH_BALANCE_KEY => !HIGH_BALANCE_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(currencyMax)
        .nullable(),
      [HIGH_BALANCE_KEY]: Yup.number()
        .label('High Balance')
        .when(LOW_BALANCE_KEY, {
          is: LOW_BALANCE_KEY => !LOW_BALANCE_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(currencyMax)
        .nullable()
    },
    [LOW_BALANCE_KEY, HIGH_BALANCE_KEY]
  )

  const viewCrypto = it =>
    R.compose(
      R.path(['display']),
      R.find(R.propEq('code', it))
    )(cryptoCurrencies)

  const elements = [
    {
      name: CRYPTOCURRENCY_KEY,
      header: 'Cryptocurrency',
      width: 166,
      size: 'sm',
      view: viewCrypto,
      input: Autocomplete,
      inputProps: {
        options: it => R.concat(suggestions, findSuggestion(it)),
        optionsLimit: null,
        valueProp: 'code',
        labelProp: 'display'
      }
    },
    {
      name: LOW_BALANCE_KEY,
      width: 155,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: currency,
      inputProps: {
        decimalPlaces: 2
      }
    },
    {
      name: HIGH_BALANCE_KEY,
      width: 155,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: currency,
      inputProps: {
        decimalPlaces: 2
      }
    }
  ]

  return (
    <EditableTable
      name={NAME}
      title="Overrides"
      error={error?.message}
      enableDelete
      enableEdit
      enableCreate
      save={it => save(section, it)}
      initialValues={initialValues}
      validationSchema={validationSchema}
      forceDisable={isDisabled(NAME) || !cryptoCurrencies}
      data={setupValues}
      elements={elements}
      disableAdd={!suggestions?.length}
      onDelete={onDelete}
      setEditing={innerSetEditing}
    />
  )
}

export default CryptoBalanceOverrides
