import * as R from 'ramda'

import schema from 'src/pages/Services/schemas'
const contains = crypto => R.compose(R.contains(crypto), R.prop('cryptos'))
const sameClass = type => R.propEq('class', type)
const filterConfig = (crypto, type) =>
  R.filter(it => sameClass(type)(it) && contains(crypto)(it))
export const getItems = (accountsConfig, accounts, type, crypto) => {
  const fConfig = filterConfig(crypto, type)(accountsConfig)
  const find = code => accounts && accounts[code]

  const [filled, unfilled] = R.partition(({ code }) => {
    const account = find(code)
    if (!schema[code]) return true

    const { getValidationSchema } = schema[code]
    return getValidationSchema(account).isValidSync(account)
  })(fConfig)

  return { filled, unfilled }
}
