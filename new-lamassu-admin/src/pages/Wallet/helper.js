import * as R from 'ramda'
import * as Yup from 'yup'

import {
  Autocomplete,
  Checkbox,
  NumberInput
} from 'src/components/inputs/formik'
import { disabledColor } from 'src/styling/variables'
import { CURRENCY_MAX } from 'src/utils/constants'
import { defaultToZero } from 'src/utils/number'

const classes = {
  editDisabled: {
    color: disabledColor
  }
}
const filterClass = type => R.filter(it => it.class === type)
const filterCoins = ({ id }) => R.filter(it => R.contains(id)(it.cryptos))

const WalletSchema = Yup.object().shape({
  ticker: Yup.string('The ticker must be a string').required(
    'The ticker is required'
  ),
  wallet: Yup.string('The wallet must be a string').required(
    'The wallet is required'
  ),
  exchange: Yup.string('The exchange must be a string').required(
    'The exchange is required'
  ),
  zeroConf: Yup.string('The confidence checking must be a string'),
  zeroConfLimit: Yup.number('The 0-conf limit must be an integer')
    .integer('The 0-conf limit must be an integer')
    .min(0, 'The 0-conf limit must be a positive integer')
    .max(CURRENCY_MAX)
    .transform(defaultToZero)
})

const AdvancedWalletSchema = Yup.object().shape({
  cryptoUnits: Yup.string().required(),
  feeMultiplier: Yup.string().required(),
  allowTransactionBatching: Yup.boolean()
})

const OverridesSchema = Yup.object().shape({
  cryptoUnits: Yup.string().required(),
  feeMultiplier: Yup.string()
    .default(() => '1')
    .required(),
  cryptoCurrency: Yup.string().required(),
  allowTransactionBatching: Yup.boolean()
    .default(() => false)
    .required()
})

const OverridesDefaults = {
  cryptoUnits: '',
  feeMultiplier: '',
  cryptoCurrency: '',
  allowTransactionBatching: null
}

const viewFeeMultiplier = it =>
  R.compose(R.prop(['display']), R.find(R.propEq('code', it)))(feeOptions)

const feeOptions = [
  { display: '+60%', code: '1.6' },
  { display: '+50%', code: '1.5' },
  { display: '+40%', code: '1.4' },
  { display: '+30%', code: '1.3' },
  { display: '+20%', code: '1.2' },
  { display: '+10%', code: '1.1' },
  { display: 'Default', code: '1' },
  { display: '-10%', code: '0.9' },
  { display: '-20%', code: '0.8' },
  { display: '-30%', code: '0.7' },
  { display: '-40%', code: '0.6' },
  { display: '-50%', code: '0.5' },
  { display: '-60%', code: '0.4' }
]

const cryptoUnitsDefaultOptions = [
  { display: 'mili', code: 'mili' },
  { display: 'full', code: 'full' }
]

const getCryptoUnitsOptions = R.curry((coinUtils, it) => {
  if (R.isNil(it.cryptoCurrency)) return cryptoUnitsDefaultOptions
  const options = R.keys(coinUtils.getCryptoCurrency(it.cryptoCurrency).units)
  return R.map(option => {
    return { code: option, display: option }
  })(options)
})

const getAdvancedWalletElements = () => {
  return [
    {
      name: 'cryptoUnits',
      size: 'sm',
      stripe: true,
      width: 190,
      input: Autocomplete,
      inputProps: {
        options: cryptoUnitsDefaultOptions,
        valueProp: 'code',
        labelProp: 'display'
      }
    },
    {
      name: 'allowTransactionBatching',
      header: `Allow BTC Transaction Batching`,
      size: 'sm',
      stripe: true,
      width: 260,
      view: (_, ite) => {
        return ite.allowTransactionBatching ? 'Yes' : `No`
      },
      input: Checkbox
    },
    {
      name: 'feeMultiplier',
      header: `BTC Miner's Fee`,
      size: 'sm',
      stripe: true,
      width: 250,
      view: viewFeeMultiplier,
      input: Autocomplete,
      inputProps: {
        options: feeOptions,
        valueProp: 'code',
        labelProp: 'display'
      }
    }
  ]
}

const getAdvancedWalletElementsOverrides = (
  coinSuggestions,
  findSuggestion,
  coinUtils
) => {
  return [
    {
      name: 'cryptoCurrency',
      width: 180,
      input: Autocomplete,
      inputProps: {
        options: it => R.concat(coinSuggestions, findSuggestion(it)),
        optionsLimit: null,
        valueProp: 'code',
        labelProp: 'display'
      },
      size: 'sm'
    },
    {
      name: 'cryptoUnits',
      size: 'sm',
      stripe: true,
      width: 190,
      input: Autocomplete,
      inputProps: {
        options: getCryptoUnitsOptions(coinUtils),
        valueProp: 'code',
        labelProp: 'display'
      }
    },
    {
      name: 'allowTransactionBatching',
      size: 'sm',
      stripe: true,
      width: 250,
      view: (_, ite) => {
        if (ite.cryptoCurrency !== 'BTC')
          return <span style={classes.editDisabled}>{`No`}</span>
        return ite.allowTransactionBatching ? 'Yes' : 'No'
      },
      input: Checkbox,
      editable: it => it.cryptoCurrency === 'BTC'
    },
    {
      name: 'feeMultiplier',
      header: `Miner's Fee`,
      size: 'sm',
      stripe: true,
      width: 250,
      view: (_, ite) => {
        if (ite.cryptoCurrency !== 'BTC')
          return <span style={classes.editDisabled}>{`Default`}</span>
        return viewFeeMultiplier(ite.feeMultiplier)
      },
      input: Autocomplete,
      inputProps: {
        options: feeOptions,
        valueProp: 'code',
        labelProp: 'display'
      },
      editable: it => it.cryptoCurrency === 'BTC'
    }
  ]
}

const has0Conf = R.complement(
  /* NOTE: List of coins without 0conf settings. */
  R.pipe(R.prop('id'), R.flip(R.includes)(['ETH', 'USDT']))
)

const getElements = (cryptoCurrencies, accounts, onChange, wizard = false) => {
  const widthAdjust = wizard ? 11 : 0
  const viewCryptoCurrency = it => {
    const currencyDisplay = R.compose(
      it => `${R.prop(['display'])(it)} ${it?.isBeta ? '(Beta)' : ''}`,
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
      width: 150 - widthAdjust,
      view: viewCryptoCurrency,
      size: 'sm',
      editable: false
    },
    {
      name: 'ticker',
      size: 'sm',
      stripe: true,
      view: getDisplayName('ticker'),
      width: 175 - widthAdjust,
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
      width: 175 - widthAdjust,
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
      width: 175 - widthAdjust,
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
      view: (it, row) => {
        const displayName = getDisplayName('zeroConf')(it, row)
        return has0Conf(row) ? (
          displayName
        ) : (
          <span style={classes.editDisabled}>{displayName}</span>
        )
      },
      input: Autocomplete,
      width: 210 - widthAdjust,
      inputProps: {
        options: getOptions('zeroConf'),
        valueProp: 'code',
        labelProp: 'display',
        optionsLimit: null,
        onChange
      },
      editable: has0Conf
    },
    {
      name: 'zeroConfLimit',
      header: '0-conf Limit',
      size: 'sm',
      stripe: true,
      view: (it, row) =>
        has0Conf(row) ? it : <span style={classes.editDisabled}>{it}</span>,
      input: NumberInput,
      width: 145 - widthAdjust,
      inputProps: {
        decimalPlaces: 0
      },
      editable: has0Conf
    }
  ]
}

export {
  WalletSchema,
  AdvancedWalletSchema,
  getElements,
  filterClass,
  getAdvancedWalletElements,
  getAdvancedWalletElementsOverrides,
  OverridesDefaults,
  OverridesSchema,
  has0Conf
}
