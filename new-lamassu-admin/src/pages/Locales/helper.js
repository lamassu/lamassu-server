import { createFilterOptions } from '@material-ui/lab/Autocomplete'
import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'

const LANGUAGE_SELECTION_LIMIT = 4

const getFields = (getData, names) => {
  return R.filter(it => R.includes(it.name, names), allFields(getData))
}

const allFields = getData => {
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
  const countryData = getData(['countries'])
  const currencyData = getData(['currencies'])
  const languageData = getData(['languages'])
  const cryptoData = getData(['cryptoCurrencies'])
  return [
    {
      name: 'machine',
      width: 200,
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
      name: 'country',
      width: 200,
      size: 'sm',
      view: getView(countryData, 'display'),
      input: Autocomplete,
      inputProps: {
        options: countryData,
        valueProp: 'code',
        getLabel: R.path(['display'])
      }
    },
    {
      name: 'fiatCurrency',
      width: 150,
      size: 'sm',
      view: getView(currencyData, 'code'),
      input: Autocomplete,
      inputProps: {
        options: currencyData,
        valueProp: 'code',
        getLabel: R.path(['code'])
      }
    },
    {
      name: 'languages',
      width: 240,
      size: 'sm',
      view: displayCodeArray(languageData),
      input: Autocomplete,
      inputProps: {
        options: languageData,
        valueProp: 'code',
        getLabel: R.path(['display']),
        multiple: true,
        limit: LANGUAGE_SELECTION_LIMIT
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
        multiple: true,
        filterOptions: createFilterOptions({
          stringify: option => `${option.code} ${option.display}`
        })
      }
    }
  ]
}

const mainFields = auxData => {
  const getData = R.path(R.__, auxData)

  return getFields(getData, [
    'country',
    'fiatCurrency',
    'languages',
    'cryptoCurrencies'
  ])
}

const overrides = auxData => {
  const getData = R.path(R.__, auxData)

  return getFields(getData, [
    'machine',
    'country',
    'languages',
    'cryptoCurrencies'
  ])
}

const LocaleSchema = Yup.object().shape({
  country: Yup.string().required('Required'),
  fiatCurrency: Yup.string().required('Required'),
  languages: Yup.array().required('Required'),
  cryptoCurrencies: Yup.array().required('Required')
})

const OverridesSchema = Yup.object().shape({
  machine: Yup.string().required('Required'),
  country: Yup.string().required('Required'),
  languages: Yup.array().required('Required'),
  cryptoCurrencies: Yup.array().required('Required')
})

const localeDefaults = {
  country: '',
  fiatCurrency: '',
  languages: [],
  cryptoCurrencies: []
}

const overridesDefaults = {
  machine: '',
  country: '',
  languages: [],
  cryptoCurrencies: []
}

export {
  mainFields,
  overrides,
  LocaleSchema,
  OverridesSchema,
  localeDefaults,
  overridesDefaults
}
