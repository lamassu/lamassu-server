import * as R from 'ramda'

import { onlyFirstToUpper } from 'src/utils/string'

/* Expects a customer ID card data object */
const formatFullName = R.pipe(
  R.pick(['firstName', 'lastName']),
  R.values,
  R.reject(R.allPass([R.isNil, R.isEmpty])),
  R.map(onlyFirstToUpper),
  R.join(' ')
)

const formatName = idCardData => {
  const innerFormatName = ({ firstName, lastName }) =>
    firstName && lastName
      ? `${R.o(R.toUpper, R.head)(firstName)}. ${lastName}`
      : R.isNil(firstName)
      ? lastName
      : R.isNil(lastName)
      ? firstName
      : null
  return idCardData ? innerFormatName(idCardData) : null
}

/* Expects a transaction object */
const displayName = ({
  isAnonymous,
  customerName,
  customerIdCardData,
  customerPhone,
  customerEmail
}) =>
  isAnonymous
    ? 'Anonymous'
    : customerName ||
      customerEmail ||
      R.defaultTo(customerPhone, formatName(customerIdCardData))

export { displayName, formatFullName, formatName }
