import * as R from 'ramda'
import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { disabledColor } from 'src/styling/variables'
import { CURRENCY_MAX } from 'src/utils/constants'
import { transformNumber } from 'src/utils/number'

const classes = {
  editDisabled: {
    color: disabledColor
  }
}
const filterClass = type => R.filter(it => it.class === type)
const filterCoins = ({ id }) => R.filter(it => R.contains(id)(it.cryptos))

const WalletSchema = Yup.object().shape({
  ticker: Yup.string().required(),
  wallet: Yup.string().required(),
  exchange: Yup.string().required(),
  zeroConf: Yup.string().required(),
  zeroConfLimit: Yup.number()
    .integer()
    .required('Zero Conf Limit is a required field')
    .min(0)
    .max(CURRENCY_MAX)
    .transform(transformNumber)
})

const getElements = (cryptoCurrencies, accounts, onChange, wizard = false) => {
  const widthAdjust = wizard ? 11 : 0
  const viewCryptoCurrency = it => {
    const currencyDisplay = R.compose(
      R.prop(['display']),
      R.find(R.propEq('code', it))
    )(cryptoCurrencies)
    return currencyDisplay
  }
  const filterOptions = type => filterClass(type)(accounts || [])

  const getDisplayName = type => it =>
    R.compose(
      R.prop('display'),
      R.find(R.propEq('code', it))
    )(filterOptions(type))

  const getOptions = R.curry((option, it) =>
    filterCoins(it)(filterOptions(option))
  )

  return [
    {
      name: 'id',
      header: 'Cryptocurrency',
      width: 180 - widthAdjust,
      view: viewCryptoCurrency,
      size: 'sm',
      editable: false
    },
    {
      name: 'ticker',
      size: 'sm',
      stripe: true,
      view: getDisplayName('ticker'),
      width: 190 - widthAdjust,
      input: Autocomplete,
      inputProps: {
        options: getOptions('ticker'),
        valueProp: 'code',
        labelProp: 'display',
        optionsLimit: null
      }
    },
    {
      name: 'wallet',
      size: 'sm',
      stripe: true,
      view: getDisplayName('wallet'),
      width: 190 - widthAdjust,
      input: Autocomplete,
      inputProps: {
        options: getOptions('wallet'),
        valueProp: 'code',
        labelProp: 'display',
        optionsLimit: null,
        onChange
      }
    },
    {
      name: 'exchange',
      size: 'sm',
      stripe: true,
      view: getDisplayName('exchange'),
      width: 190 - widthAdjust,
      input: Autocomplete,
      inputProps: {
        options: getOptions('exchange'),
        valueProp: 'code',
        labelProp: 'display',
        optionsLimit: null,
        onChange
      }
    },
    {
      name: 'zeroConf',
      header: 'Confidence Checking',
      size: 'sm',
      stripe: true,
      view: getDisplayName('zeroConf'),
      input: Autocomplete,
      width: 220 - widthAdjust,
      inputProps: {
        options: getOptions('zeroConf'),
        valueProp: 'code',
        labelProp: 'display',
        optionsLimit: null,
        onChange
      }
    },
    {
      name: 'zeroConfLimit',
      size: 'sm',
      stripe: true,
      view: (it, row) =>
        row.id === 'ETH' ? <span style={classes.editDisabled}>{it}</span> : it,
      input: NumberInput,
      width: 190 - widthAdjust,
      inputProps: {
        decimalPlaces: 0
      },
      editable: row => row.id !== 'ETH'
    }
  ]
}

export { WalletSchema, getElements, filterClass }
