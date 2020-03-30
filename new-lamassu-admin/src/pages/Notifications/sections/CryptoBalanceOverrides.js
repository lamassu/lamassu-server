import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import TextInputFormik from 'src/components/inputs/formik/TextInput.js'

import NotificationsCtx from '../NotificationsContext'

const HIGH_BALANCE_KEY = 'highBalance'
const LOW_BALANCE_KEY = 'lowBalance'
const CRYPTOCURRENCY_KEY = 'cryptoCurrency'
const NAME = 'cryptoBalanceOverrides'

const CryptoBalanceOverrides = ({ section }) => {
  const {
    cryptoCurrencies,
    data,
    save,
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

  const getSuggestions = () => {
    const overridenCryptos = R.map(
      override => override[CRYPTOCURRENCY_KEY],
      setupValues
    )
    return R.without(overridenCryptos, cryptoCurrencies ?? [])
  }

  const initialValues = {
    [CRYPTOCURRENCY_KEY]: null,
    [LOW_BALANCE_KEY]: '',
    [HIGH_BALANCE_KEY]: ''
  }

  const validationSchema = Yup.object().shape({
    [CRYPTOCURRENCY_KEY]: Yup.string().required(),
    [LOW_BALANCE_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(99999999)
      .required(),
    [HIGH_BALANCE_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(99999999)
      .required()
  })

  const suggestions = getSuggestions()

  const elements = [
    {
      name: CRYPTOCURRENCY_KEY,
      header: 'Cryptocurrency',
      width: 166,
      size: 'sm',
      view: R.path(['display']),
      input: Autocomplete,
      inputProps: {
        options: suggestions,
        limit: null,
        forceShowValue: true,
        getOptionSelected: R.eqProps('display')
      }
    },
    {
      name: LOW_BALANCE_KEY,
      width: 155,
      textAlign: 'right',
      bold: true,
      input: TextInputFormik,
      suffix: currency
    },
    {
      name: HIGH_BALANCE_KEY,
      width: 155,
      textAlign: 'right',
      bold: true,
      input: TextInputFormik,
      suffix: currency
    }
  ]

  return (
    <EditableTable
      name={NAME}
      title="Overrides"
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
