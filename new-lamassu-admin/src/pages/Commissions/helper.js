import * as _ from 'lodash/fp'
import * as R from 'ramda'
import React from 'react'
import { v4 } from 'uuid'
import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import TextInput from 'src/components/inputs/formik/TextInput.js'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

const ALL_MACHINES = {
  name: 'All Machines',
  deviceId: 'ALL_MACHINES'
}

const ALL_COINS = {
  display: 'All Coins',
  code: 'ALL_COINS'
}

const SHOW_ALL = 'Show all'

const ORDER_OPTIONS = [
  'Machine name',
  'Cryptocurrency',
  'Cash-in',
  'Cash-out',
  'Fixed Fee',
  'Minimum Tx'
]

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

const getView = (data, code, compare) => it => {
  if (!data) return ''

  return R.compose(R.prop(code), R.find(R.propEq(compare ?? 'code', it)))(data)
}

const displayCodeArray = data => it => {
  if (!it) return it

  return R.compose(R.join(', '), R.map(getView(data, 'display')))(it)
}

const onCryptoChange = (prev, curr, setValue) => {
  const hasAllCoins = R.includes(ALL_COINS.code)(curr)
  const hadAllCoins = R.includes(ALL_COINS.code)(prev)

  if (hasAllCoins && hadAllCoins && R.length(curr) > 1) {
    return setValue(R.reject(R.equals(ALL_COINS.code))(curr))
  }

  if (hasAllCoins && !hadAllCoins) {
    return setValue([ALL_COINS.code])
  }

  setValue(curr)
}

const getOverridesFields = (getData, currency, auxElements) => {
  const machineData = [ALL_MACHINES].concat(getData(['machines']))
  const rawCryptos = getData(['cryptoCurrencies'])
  const cryptoData = [ALL_COINS].concat(
    R.map(it => ({ display: it.code, code: it.code }))(rawCryptos ?? [])
  )

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
        options: cryptoData,
        valueProp: 'code',
        getLabel: R.path(['display']),
        multiple: true,
        onChange: onCryptoChange
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

const percentMax = 100
const currencyMax = 9999999
const schema = Yup.object().shape({
  cashIn: Yup.number()
    .label('Cash-in')
    .min(0)
    .max(percentMax)
    .required(),
  cashOut: Yup.number()
    .label('Cash-out')
    .min(0)
    .max(percentMax)
    .required(),
  fixedFee: Yup.number()
    .label('Fixed Fee')
    .min(0)
    .max(currencyMax)
    .required(),
  minimumTx: Yup.number()
    .label('Minimum Tx')
    .min(0)
    .max(currencyMax)
    .required()
})

const getAlreadyUsed = (id, machine, values) => {
  const getCrypto = R.prop('cryptoCurrencies')
  const getMachineId = R.prop('machine')

  const filteredOverrides = R.filter(R.propEq('machine', machine))(values)
  const originalValue = R.find(R.propEq('id', id))(values)

  const originalCryptos = getCrypto(originalValue)
  const originalMachineId = getMachineId(originalValue)

  const alreadyUsed = R.compose(
    R.uniq,
    R.flatten,
    R.map(getCrypto)
  )(filteredOverrides)

  if (machine !== originalMachineId) return alreadyUsed ?? []

  return R.difference(alreadyUsed, originalCryptos)
}

const getOverridesSchema = (values, rawData) => {
  const getData = R.path(R.__, rawData)
  const machineData = [ALL_MACHINES].concat(getData(['machines']))
  const rawCryptos = getData(['cryptoCurrencies'])
  const cryptoData = [ALL_COINS].concat(
    R.map(it => ({ display: it.code, code: it.code }))(rawCryptos ?? [])
  )

  return Yup.object().shape({
    machine: Yup.string()
      .nullable()
      .label('Machine')
      .required(),
    cryptoCurrencies: Yup.array()
      .test({
        test() {
          const { id, machine, cryptoCurrencies } = this.parent
          const alreadyUsed = getAlreadyUsed(id, machine, values)

          const isAllMachines = machine === ALL_MACHINES.deviceId
          const isAllCoins = R.includes(ALL_COINS.code, cryptoCurrencies)
          if (isAllMachines && isAllCoins) {
            return this.createError({
              message: `All machines and all coins should be configured in the default setup table`
            })
          }

          const repeated = R.intersection(alreadyUsed, cryptoCurrencies)
          if (!R.isEmpty(repeated)) {
            const codes = displayCodeArray(cryptoData)(repeated)
            const machineView = getView(
              machineData,
              'name',
              'deviceId'
            )(machine)

            const message = `${codes} already overriden for machine: ${machineView}`

            return this.createError({ message })
          }
          return true
        }
      })
      .label('Crypto Currencies')
      .required(),
    cashIn: Yup.number()
      .label('Cash-in')
      .min(0)
      .max(percentMax)
      .required(),
    cashOut: Yup.number()
      .label('Cash-out')
      .min(0)
      .max(percentMax)
      .required(),
    fixedFee: Yup.number()
      .label('Fixed Fee')
      .min(0)
      .max(currencyMax)
      .required(),
    minimumTx: Yup.number()
      .label('Minimum Tx')
      .min(0)
      .max(currencyMax)
      .required()
  })
}

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

const getOrder = ({ machine, cryptoCurrencies }) => {
  const isAllMachines = machine === ALL_MACHINES.deviceId
  const isAllCoins = R.contains(ALL_COINS.code, cryptoCurrencies)

  if (isAllMachines && isAllCoins) return 0
  if (isAllMachines) return 1
  if (isAllCoins) return 2

  return 3
}

const createCommissions = (cryptoCode, deviceId, isDefault, config) => {
  return {
    minimumTx: config.minimumTx,
    fixedFee: config.fixedFee,
    cashOut: config.cashOut,
    cashIn: config.cashIn,
    machine: deviceId,
    cryptoCurrencies: [cryptoCode],
    default: isDefault,
    id: v4()
  }
}

const getCommissions = (cryptoCode, deviceId, config) => {
  const overrides = R.prop('overrides', config)

  if (overrides && !R.isEmpty(overrides)) {
    const specificOverride = R.find(
      it =>
        it.machine === deviceId && _.includes(cryptoCode)(it.cryptoCurrencies)
    )(overrides)

    if (specificOverride !== undefined)
      return createCommissions(cryptoCode, deviceId, false, specificOverride)

    const machineOverride = R.find(
      it =>
        it.machine === deviceId && _.includes('ALL_COINS')(it.cryptoCurrencies)
    )(overrides)

    if (machineOverride !== undefined)
      return createCommissions(cryptoCode, deviceId, false, machineOverride)

    const coinOverride = R.find(
      it =>
        it.machine === 'ALL_MACHINES' &&
        _.includes(cryptoCode)(it.cryptoCurrencies)
    )(overrides)

    if (coinOverride !== undefined)
      return createCommissions(cryptoCode, deviceId, false, coinOverride)
  }

  return createCommissions(cryptoCode, deviceId, true, config)
}

const getMachineCoins = (deviceId, localeConfig) => {
  const machineCoins = R.prop('cryptoCurrencies', localeConfig)

  const overrides = R.prop('overrides', localeConfig)

  if (!R.isEmpty(overrides)) {
    const override = R.find(it => it.machine === deviceId)(overrides)

    if (override !== undefined) return R.prop('cryptoCurrencies', override)
  }
  return machineCoins
}

const getListCommissionsSchema = () => {
  return Yup.object().shape({
    machine: Yup.string()
      .label('Machine')
      .required(),
    cryptoCurrencies: Yup.array()
      .label('Crypto Currency')
      .required(),
    cashIn: Yup.number()
      .label('Cash-in')
      .min(0)
      .max(percentMax)
      .required(),
    cashOut: Yup.number()
      .label('Cash-out')
      .min(0)
      .max(percentMax)
      .required(),
    fixedFee: Yup.number()
      .label('Fixed Fee')
      .min(0)
      .max(currencyMax)
      .required(),
    minimumTx: Yup.number()
      .label('Minimum Tx')
      .min(0)
      .max(currencyMax)
      .required()
  })
}

const getTextStyle = (obj, isEditing) => {
  return { color: obj.default ? '#1b2559' : '#44e188' }
}

const commissionsList = (auxData, currency, auxElements) => {
  const getData = R.path(R.__, auxData)

  return getListCommissionsFields(getData, currency, defaults)
}

const getListCommissionsFields = (getData, currency, defaults) => {
  const machineData = [ALL_MACHINES].concat(getData(['machines']))
  // const rawCryptos = getData(['cryptoCurrencies'])
  // const cryptoData = R.map(it => ({ display: it.code, code: it.code }))(
  //   rawCryptos ?? []
  // )

  return [
    {
      name: 'machine',
      width: 196,
      size: 'sm',
      view: getView(machineData, 'name', 'deviceId'),
      input: TextInput,
      editable: false,
      inputProps: {
        valueProp: 'deviceId',
        getLabel: R.path(['name'])
      }
    },
    {
      name: 'cryptoCurrencies',
      display: 'Crypto Currency',
      width: 280,
      view: R.prop(0),
      size: 'sm',
      input: TextInput,
      editable: false
    },
    {
      header: cashInHeader,
      name: 'cashIn',
      display: 'Cash-in',
      width: 130,
      input: NumberInput,
      textAlign: 'right',
      suffix: '%',
      textStyle: obj => getTextStyle(obj),
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
      greenText: true,
      suffix: '%',
      textStyle: obj => getTextStyle(obj),
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
      textStyle: obj => getTextStyle(obj),
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
      textStyle: obj => getTextStyle(obj),
      inputProps: {
        decimalPlaces: 2
      }
    }
  ]
}

const filterCommissions = (coinFilter, machineFilter, machines) =>
  R.compose(
    R.filter(byMachine(machineFilter, machines)),
    R.filter(byCoin(coinFilter))
  )

const byMachine = (filter, machines) => it =>
  (filter === SHOW_ALL) |
  (filter === getView(machines, 'name', 'deviceId')(it.machine))

const byCoin = filter => it =>
  (filter === SHOW_ALL) | (filter === it.cryptoCurrencies[0])

const sortCommissionsBy = (prop, machines) => {
  switch (prop) {
    case ORDER_OPTIONS[1]:
      return R.sortBy(R.path(['cryptoCurrencies', 0]))
    case ORDER_OPTIONS[2]:
      return R.sortBy(R.prop('cashIn'))
    case ORDER_OPTIONS[3]:
      return R.sortBy(R.prop('cashOut'))
    case ORDER_OPTIONS[4]:
      return R.sortBy(R.prop('fixedFee'))
    case ORDER_OPTIONS[5]:
      return R.sortBy(R.prop('minimumTx'))
    default:
      return R.sortBy(
        R.compose(getView(machines, 'name', 'deviceId'), R.prop('machine'))
      )
  }
}

export {
  mainFields,
  overrides,
  schema,
  getOverridesSchema,
  defaults,
  overridesDefaults,
  getOrder,
  getCommissions,
  getMachineCoins,
  getListCommissionsSchema,
  commissionsList,
  getView,
  byMachine,
  byCoin,
  sortCommissionsBy,
  filterCommissions,
  SHOW_ALL,
  ORDER_OPTIONS
}
