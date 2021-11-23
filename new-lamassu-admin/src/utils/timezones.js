import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz/fp'
import { format } from 'date-fns/fp'

const toUtc = date => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return zonedTimeToUtc(browserTimezone, date)
}

const toTimezone = (date, timezone) => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return utcToZonedTime(timezone, zonedTimeToUtc(browserTimezone, date))
}

const formatDate = (date, timezone, pattern) => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const newDate = utcToZonedTime(
    timezone,
    zonedTimeToUtc(browserTimezone, date)
  )
  return format(pattern, newDate)
}

const formatDateNonUtc = (date, pattern) => format(pattern, date)

export { toUtc, toTimezone, formatDate, formatDateNonUtc }
