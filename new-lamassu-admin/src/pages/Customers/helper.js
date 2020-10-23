import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'

const CUSTOMER_BLOCKED = 'blocked'

const getAuthorizedStatus = it =>
  it.authorizedOverride === CUSTOMER_BLOCKED
    ? { label: 'Blocked', type: 'error' }
    : it.daysSuspended > 0
    ? { label: `${it.daysSuspended} day suspension`, type: 'warning' }
    : { label: 'Authorized', type: 'success' }

const getFormattedPhone = (phone, country) =>
  phone && country
    ? parsePhoneNumberFromString(phone, country).formatInternational()
    : ''

const getName = it => {
  const idData = R.path(['idCardData'])(it)

  return `${R.path(['firstName'])(idData) ?? ''} ${R.path(['lastName'])(
    idData
  ) ?? ''}`.trim()
}

export { getAuthorizedStatus, getFormattedPhone, getName }
