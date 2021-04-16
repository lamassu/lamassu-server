import * as R from 'ramda'

export const isLoggedIn = userData =>
  !R.isNil(userData?.id) &&
  !R.isNil(userData?.username) &&
  !R.isNil(userData?.role)

export const ROLES = {
  USER: 'user',
  SUPERUSER: 'superuser'
}
