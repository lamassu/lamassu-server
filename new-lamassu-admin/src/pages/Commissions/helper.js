import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

const ALL_MACHINES = {
  name: 'All Machines',
  deviceId: 'ALL_MACHINES'
}

const cashInAndOutHeaderStyle = { marginLeft: 6 }

const cashInHeader = (
  <div>
    <TxInIcon />
    <span style={cashInAndOutHeaderStyle}>Cash-in</span>
  </div>
)

const cashOutHeader = (
  <div>
    <TxOutIcon />
    <span style={cashInAndOutHeaderStyle}>Cash-out</span>
  </div>
)

const getOverridesFields = (getData, currency, auxElements) => {
  const getView = (data, code, compare) => it => {
    if (!data) return ''

    return R.compose(
      R.prop(code),
      R.find(R.propEq(compare ?? 'code', it))
    )(data)
  }

  const displayCodeArray = data => it => {
    if (!it) return it

    return R.compose(R.join(', '), R.map(getView(data, 'code')))(it)
  }

  var overridenMachineCoins = R.reduceBy(
    (acc, { cryptoCurrencies }) => acc.concat(cryptoCurrencies),
    [],
    R.prop('machine'),
    auxElements
  )

  const suggestionFilter = (it, cryptoData) => {
    if (!it?.machine) return cryptoData

    return R.differenceWith(
      (x, y) => x.code === y && !it?.cryptoCurrencies.includes(x.code),
      cryptoData,
      overridenMachineCoins[it?.machine]
    )
  }

  const machineData = [ALL_MACHINES].concat(getData(['machines']))
  const cryptoData = getData(['cryptoCurrencies'])

  return [
    {
      name: 'machine',
      width: 196,
      size: 'sm',
      view: getView(machineData, 'name', 'deviceId'),
      input: Autocomplete,
      inputProps: {
        options: machineData,
        valueProp: 'deviceId',
        getLabel: R.path(['name'])
      }
    },
    {
      name: 'cryptoCurrencies',
      width: 280,
      size: 'sm',
      view: displayCodeArray(cryptoData),
      input: Autocomplete,
      inputProps: {
        options: it => suggestionFilter(it, cryptoData),
        valueProp: 'code',
        getLabel: R.path(['code']),
        multiple: true
      }
    },
    {
      header: cashInHeader,
      name: 'cashIn',
      display: 'Cash-in',
      width: 130,
      input: NumberInput,
      textAlign: 'right',
      suffix: '%',
      inputProps: {
        decimalPlaces: 3
      }
    },
    {
      header: cashOutHeader,
      name: 'cashOut',
      display: 'Cash-out',
      width: 130,
      input: NumberInput,
      textAlign: 'right',
      suffix: '%',
      inputProps: {
        decimalPlaces: 3
      }
    },
    {
      name: 'fixedFee',
      display: 'Fixed fee',
      width: 144,
      input: NumberInput,
      doubleHeader: 'Cash-in only',
      textAlign: 'right',
      suffix: currency,
      inputProps: {
        decimalPlaces: 2
      }
    },
    {
      name: 'minimumTx',
      display: 'Minimun Tx',
      width: 144,
      input: NumberInput,
      doubleHeader: 'Cash-in only',
      textAlign: 'right',
      suffix: currency,
      inputProps: {
        decimalPlaces: 2
      }
    }
  ]
}

const mainFields = currency => [
  {
    header: cashInHeader,
    name: 'cashIn',
    display: 'Cash-in',
    width: 169,
    size: 'lg',
    input: NumberInput,
    suffix: '%',
    inputProps: {
      decimalPlaces: 3
    }
  },
  {
    header: cashOutHeader,
    name: 'cashOut',
    display: 'Cash-out',
    width: 169,
    size: 'lg',
    input: NumberInput,
    suffix: '%',
    inputProps: {
      decimalPlaces: 3
    }
  },
  {
    name: 'fixedFee',
    display: 'Fixed fee',
    width: 169,
    size: 'lg',
    doubleHeader: 'Cash-in only',
    textAlign: 'center',
    input: NumberInput,
    suffix: currency,
    inputProps: {
      decimalPlaces: 2
    }
  },
  {
    name: 'minimumTx',
    display: 'Minimun Tx',
    width: 169,
    size: 'lg',
    doubleHeader: 'Cash-in only',
    textAlign: 'center',
    input: NumberInput,
    suffix: currency,
    inputProps: {
      decimalPlaces: 2
    }
  }
]

const overrides = (auxData, currency, auxElements) => {
  const getData = R.path(R.__, auxData)

  return getOverridesFields(getData, currency, auxElements)
}

const schema = Yup.object().shape({
  cashIn: Yup.number()
    .min(0)
    .max(100)
    .required('Required'),
  cashOut: Yup.number()
    .min(0)
    .max(100)
    .required('Required'),
  fixedFee: Yup.number()
    .min(0)
    .required('Required'),
  minimumTx: Yup.number()
    .min(0)
    .required('Required')
})

const OverridesSchema = Yup.object().shape({
  machine: Yup.string().required('Required'),
  cryptoCurrencies: Yup.array().required('Required'),
  cashIn: Yup.number()
    .min(0)
    .max(100)
    .required('Required'),
  cashOut: Yup.number()
    .min(0)
    .max(100)
    .required('Required'),
  fixedFee: Yup.number()
    .min(0)
    .required('Required'),
  minimumTx: Yup.number()
    .min(0)
    .required('Required')
})

const defaults = {
  cashIn: '',
  cashOut: '',
  fixedFee: '',
  minimumTx: ''
}

const overridesDefaults = {
  machine: null,
  cryptoCurrencies: [],
  cashIn: '',
  cashOut: '',
  fixedFee: '',
  minimumTx: ''
}

export {
  mainFields,
  overrides,
  schema,
  OverridesSchema,
  defaults,
  overridesDefaults
}
