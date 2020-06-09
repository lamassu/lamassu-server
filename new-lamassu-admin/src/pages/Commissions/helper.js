import * as R from 'ramda'
import * as Yup from 'yup'

import { TextInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'

const getOverridesFields = getData => {
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

  const machineData = getData(['machines'])
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
        getLabel: R.path(['name']),
        limit: null
      }
    },
    {
      name: 'cryptoCurrencies',
      width: 270,
      size: 'sm',
      view: displayCodeArray(cryptoData),
      input: Autocomplete,
      inputProps: {
        options: cryptoData,
        valueProp: 'code',
        getLabel: R.path(['code']),
        multiple: true
      }
    },
    {
      name: 'cashIn',
      display: 'Cash-in',
      width: 140,
      input: TextInput
    },
    {
      name: 'cashOut',
      display: 'Cash-out',
      width: 140,
      input: TextInput
    },
    {
      name: 'fixedFee',
      display: 'Fixed fee',
      width: 140,
      input: TextInput
    },
    {
      name: 'minimumTx',
      display: 'Minimun Tx',
      width: 140,
      input: TextInput
    }
  ]
}

const mainFields = auxData => [
  {
    name: 'cashIn',
    display: 'Cash-in',
    width: 169,
    size: 'lg',
    input: TextInput
  },
  {
    name: 'cashOut',
    display: 'Cash-out',
    width: 169,
    size: 'lg',
    input: TextInput
  },
  {
    name: 'fixedFee',
    display: 'Fixed fee',
    width: 169,
    size: 'lg',
    input: TextInput
  },
  {
    name: 'minimumTx',
    display: 'Minimun Tx',
    width: 169,
    size: 'lg',
    input: TextInput
  }
]

const overrides = auxData => {
  const getData = R.path(R.__, auxData)

  return getOverridesFields(getData)
}

const schema = Yup.object().shape({
  cashIn: Yup.number().required('Required'),
  cashOut: Yup.number().required('Required'),
  fixedFee: Yup.number().required('Required'),
  minimumTx: Yup.number().required('Required')
})

const OverridesSchema = Yup.object().shape({
  machine: Yup.string().required('Required'),
  cryptoCurrencies: Yup.array().required('Required'),
  cashIn: Yup.number().required('Required'),
  cashOut: Yup.number().required('Required'),
  fixedFee: Yup.number().required('Required'),
  minimumTx: Yup.number().required('Required')
})

const defaults = {
  cashIn: '',
  cashOut: '',
  fixedFee: '',
  minimumTx: ''
}

const overridesDefaults = {
  machine: '',
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
