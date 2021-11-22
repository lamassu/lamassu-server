import { format } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
// import moment from 'moment'
// import * as R from 'ramda'

// const buildLabel = tz => {
//   return `(UTC${tz.utcOffsetStr}) ${R.map(it => it.city, tz.cities).join(', ')}`
// }

const formatDate = (date, timezone, pattern) => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const newDate = utcToZonedTime(
    zonedTimeToUtc(date, browserTimezone),
    timezone
  )
  return format(newDate, pattern)
}

const formatDateNonUtc = (date, pattern) => {
  return format(date, pattern)
}

export { formatDate, formatDateNonUtc }
