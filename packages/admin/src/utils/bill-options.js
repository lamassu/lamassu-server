import * as R from 'ramda'

const getBillOptions = R.curry((locale, denomiations) => {
  const currency = R.prop('fiatCurrency')(locale)
  return R.compose(
    R.map(code => ({ code: parseInt(code), display: code })),
    R.keys,
    R.path([currency, 'lengths'])
  )(denomiations)
})

export { getBillOptions }
