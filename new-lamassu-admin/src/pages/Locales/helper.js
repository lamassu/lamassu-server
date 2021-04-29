import * as ct from 'countries-and-timezones'
import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'

const getFields = (getData, names, onChange, auxElements = []) => {
  return R.filter(
    it => R.includes(it.name, names),
    allFields(getData, onChange, auxElements)
  )
}

const allFields = (getData, onChange, auxElements = []) => {
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

  const overridenMachines = R.map(override => override.machine, auxElements)

  const suggestionFilter = it =>
    R.differenceWith((x, y) => x.deviceId === y, it, overridenMachines)

  const machineData = getData(['machines'])
  const countryData = getData(['countries'])
  const currencyData = getData(['currencies'])
  const languageData = getData(['languages'])
  const cryptoData = getData(['cryptoCurrencies'])
  const timezonesData = R.values(ct.getAllTimezones())

  const possibleUTCDSTPairs = R.map(
    it => ({
      utcOffset: it.utcOffset,
      dstOffset: it.dstOffset,
      utcOffsetStr: it.utcOffsetStr,
      dstOffsetStr: it.dstOffsetStr
    }),
    R.uniqBy(
      it => [it.utcOffset, it.dstOffset, it.utcOffsetStr, it.dstOffsetStr],
      timezonesData
    )
  )

  const finalTimezones = R.sort(
    R.ascend(R.prop('utcOffset')),
    R.map(
      it => ({
        utcOffset: it.utcOffset,
        dstOffset: it.dstOffset,
        utcOffsetStr: it.utcOffsetStr,
        dstOffsetStr: it.dstOffsetStr,
        cities: R.map(
          ite => ite.name,
          R.filter(
            itx =>
              R.eqProps('utcOffset', it, itx) &&
              R.eqProps('dstOffset', it, itx),
            timezonesData
          )
        )
      }),
      possibleUTCDSTPairs
    )
  )

  const buildLabel = tz => {
    return `UTC ${tz.utcOffsetStr}${
      tz.utcOffset !== tz.dstOffset ? ' (Daylight Saving Time)' : ''
    }`
  }

  const tzLabels = R.map(
    it => ({ label: buildLabel(it), code: it }),
    finalTimezones
  )

  console.log(tzLabels)

  const findSuggestion = it => {
    const machine = R.find(R.propEq('deviceId', it.machine))(machineData)
    return machine ? [machine] : []
  }

  return [
    {
      name: 'machine',
      width: 200,
      size: 'sm',
      view: getView(machineData, 'name', 'deviceId'),
      input: Autocomplete,
      inputProps: {
        options: it =>
          R.concat(findSuggestion(it))(suggestionFilter(machineData)),
        valueProp: 'deviceId',
        labelProp: 'name'
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
        labelProp: 'display'
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
        labelProp: 'code'
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
        labelProp: 'display',
        multiple: true
      }
    },
    {
      name: 'cryptoCurrencies',
      width: 220,
      size: 'sm',
      view: displayCodeArray(cryptoData),
      input: Autocomplete,
      inputProps: {
        options: cryptoData,
        valueProp: 'code',
        labelProp: 'code',
        multiple: true,
        optionsLimit: null,
        onChange
      }
    },
    {
      name: 'timezone',
      width: 220,
      size: 'sm',
      view: getView(tzLabels, 'label'),
      input: Autocomplete,
      inputProps: {
        options: tzLabels,
        valueProp: 'code',
        labelProp: 'label'
      }
    }
  ]
}

const mainFields = (auxData, configureCoin) => {
  const getData = R.path(R.__, auxData)

  return getFields(
    getData,
    ['country', 'fiatCurrency', 'languages', 'cryptoCurrencies', 'timezone'],
    configureCoin
  )
}

const overrides = (auxData, auxElements, configureCoin) => {
  const getData = R.path(R.__, auxData)

  return getFields(
    getData,
    ['machine', 'country', 'languages', 'cryptoCurrencies'],
    configureCoin,
    auxElements
  )
}

const LocaleSchema = Yup.object().shape({
  country: Yup.string()
    .label('Country')
    .required(),
  fiatCurrency: Yup.string()
    .label('Fiat Currency')
    .required(),
  languages: Yup.array()
    .label('Languages')
    .required()
    .min(1)
    .max(4),
  cryptoCurrencies: Yup.array()
    .label('Crypto Currencies')
    .required()
    .min(1),
  timezone: Yup.object()
    .label('Timezone')
    .required()
})

const OverridesSchema = Yup.object().shape({
  machine: Yup.string()
    .label('Machine')
    .required(),
  country: Yup.string()
    .label('Country')
    .required(),
  languages: Yup.array()
    .label('Languages')
    .required()
    .min(1),
  cryptoCurrencies: Yup.array()
    .label('Crypto Currencies')
    .required()
    .min(1)
})

const localeDefaults = {
  country: '',
  fiatCurrency: '',
  languages: [],
  cryptoCurrencies: [],
  timezone: ''
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
