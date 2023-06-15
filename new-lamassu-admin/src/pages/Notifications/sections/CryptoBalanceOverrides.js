import * as R from 'ramda'
import React from 'react'
import * as uuid from 'uuid'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { fromNamespace } from 'src/utils/config'
import { CURRENCY_MAX } from 'src/utils/constants'
import { transformNumber } from 'src/utils/number'

const CryptoBalanceOverrides = ({
  data,
  save,
  onDelete,
  error,
  editing,
  setEditing
}) => {
  const { config, cryptoCurrencies, notificationSettings } = data
  const eventName = 'cryptoBalance'
  const currencyCode = fromNamespace('locale')(config).fiatCurrency
  const values = R.filter(
    it => it.event === eventName && !R.isNil(it.overrideId)
  )(notificationSettings)

  const overriddenCryptos = R.map(R.prop('cryptoCurrency'))(values)
  const suggestionFilter = R.filter(
    it => !R.contains(it.code, overriddenCryptos)
  )
  const suggestions = suggestionFilter(cryptoCurrencies)

  const findSuggestion = it => {
    const coin = R.compose(R.find(R.propEq('code', it?.value.cryptoCurrency)))(
      cryptoCurrencies
    )
    return coin ? [coin] : []
  }

  const _save = (_, it) => save(schema.cast(it))
  const _delete = id => onDelete(eventName, id)

  const initialValues = {
    event: 'cryptoBalance',
    overrideId: uuid.v4(),
    value: {
      cryptoCurrency: null,
      lowerBound: null,
      upperBound: null
    }
  }

  const schema = Yup.object().shape({
    event: Yup.string().required(),
    overrideId: Yup.string().required(),
    value: Yup.object().shape({
      cryptoCurrency: Yup.string().required(),
      lowerBound: Yup.number()
        .transform(transformNumber)
        .integer()
        .min(0)
        .max(CURRENCY_MAX)
        .nullable(),
      upperBound: Yup.number()
        .transform(transformNumber)
        .integer()
        .min(0)
        .max(CURRENCY_MAX)
        .nullable()
    })
  })

  const viewCrypto = it =>
    R.compose(
      R.path(['display']),
      R.find(R.propEq('code', it?.value.cryptoCurrency))
    )(cryptoCurrencies)

  const elements = [
    {
      name: 'value.cryptoCurrency',
      header: 'Cryptocurrency',
      width: 166,
      size: 'sm',
      view: (_, it) => viewCrypto(it),
      input: Autocomplete,
      inputProps: {
        options: it => {
          console.log(it)
          return R.concat(suggestions, findSuggestion(it))
        },
        optionsLimit: null,
        valueProp: 'code',
        labelProp: 'display'
      }
    },
    {
      name: 'value.lowerBound',
      header: 'Low Balance',
      width: 155,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: currencyCode,
      inputProps: {
        decimalPlaces: 2
      }
    },
    {
      name: 'value.upperBound',
      header: 'High Balance',
      width: 155,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: currencyCode,
      inputProps: {
        decimalPlaces: 2
      }
    }
  ]

  return (
    <EditableTable
      name="overrides"
      title="Overrides"
      error={error?.message}
      enableDelete
      enableEdit
      enableCreate
      save={_save}
      onDelete={_delete}
      initialValues={initialValues}
      validationSchema={schema}
      forceDisable={R.isEmpty(cryptoCurrencies) || R.isNil(cryptoCurrencies)}
      data={values}
      elements={elements}
      disableAdd={!suggestions?.length}
      editing={editing}
      setEditing={setEditing}
    />
  )
}

export default CryptoBalanceOverrides
