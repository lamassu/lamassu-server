import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'

const displayCodeArray = it => {
  return it ? R.compose(R.join(', '), R.map(R.path(['code'])))(it) : it
}

const getFields = (getData, names) => {
  return R.filter(it => R.includes(it.name, names), allFields(getData))
}

const allFields = getData => [
  {
    name: 'machine',
    width: 200,
    size: 'sm',
    view: R.path(['name']),
    input: Autocomplete,
    inputProps: {
      options: getData(['machines']),
      limit: null,
      forceShowValue: true,
      getOptionSelected: R.eqProps('machineId')
    }
  },
  {
    name: 'country',
    width: 200,
    size: 'sm',
    view: R.path(['display']),
    input: Autocomplete,
    inputProps: {
      options: getData(['countries']),
      getOptionSelected: R.eqProps('display')
    }
  },
  {
    name: 'fiatCurrency',
    width: 150,
    size: 'sm',
    view: R.path(['code']),
    input: Autocomplete,
    inputProps: {
      options: getData(['currencies']),
      getOptionSelected: R.eqProps('display')
    }
  },
  {
    name: 'languages',
    width: 240,
    size: 'sm',
    view: displayCodeArray,
    input: Autocomplete,
    inputProps: {
      options: getData(['languages']),
      getLabel: R.path(['code']),
      getOptionSelected: R.eqProps('code'),
      multiple: true
    }
  },
  {
    name: 'cryptoCurrencies',
    width: 270,
    size: 'sm',
    view: displayCodeArray,
    input: Autocomplete,
    inputProps: {
      options: getData(['cryptoCurrencies']),
      getLabel: it => R.path(['code'])(it) ?? it,
      getOptionSelected: R.eqProps('code'),
      multiple: true
    }
  }
]

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
  country: Yup.object().required('Required'),
  fiatCurrency: Yup.object().required('Required'),
  languages: Yup.array().required('Required'),
  cryptoCurrencies: Yup.array().required('Required')
})

const OverridesSchema = Yup.object().shape({
  machine: Yup.object().required('Required'),
  country: Yup.object().required('Required'),
  languages: Yup.array().required('Required'),
  cryptoCurrencies: Yup.array().required('Required')
})

const localeDefaults = {
  country: null,
  fiatCurrency: null,
  languages: [],
  cryptoCurrencies: []
}

const overridesDefaults = {
  machine: null,
  country: null,
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
