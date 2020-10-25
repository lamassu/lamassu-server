import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'

const filterClass = type => R.filter(it => it.class === type)
const filterCoins = ({ id }) => R.filter(it => R.contains(id)(it.cryptos))

const WalletSchema = Yup.object().shape({
  ticker: Yup.string().required('Required'),
  wallet: Yup.string().required('Required'),
  exchange: Yup.string().required('Required'),
  zeroConf: Yup.string().required('Required')
})

const getElements = (
  cryptoCurrencies,
  accounts,
  enableThirdPartyService,
  wizard = false
) => {
  const widthAdjust = wizard ? 11 : 0
  const viewCryptoCurrency = it =>
    R.compose(
      R.prop(['display']),
      R.find(R.propEq('code', it))
    )(cryptoCurrencies)

  const filterOptions = type => filterClass(type)(accounts || [])

  const getDisplayName = type => it =>
    R.compose(
      R.prop('display'),
      R.find(R.propEq('code', it))
    )(filterOptions(type))

  const getOptions = R.curry((option, it) =>
    filterCoins(it)(filterOptions(option))
  )

  const onChange = (prev, curr) => enableThirdPartyService(curr)

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
        getLabel: R.path(['display']),
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
        getLabel: R.path(['display']),
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
        getLabel: R.path(['display']),
        optionsLimit: null,
        onChange
      }
    },
    {
      name: 'zeroConf',
      size: 'sm',
      stripe: true,
      view: getDisplayName('zeroConf'),
      input: Autocomplete,
      width: 190 - widthAdjust,
      inputProps: {
        options: getOptions('zeroConf'),
        valueProp: 'code',
        getLabel: R.path(['display']),
        optionsLimit: null,
        onChange
      }
    }
  ]
}

export { WalletSchema, getElements, filterClass }
