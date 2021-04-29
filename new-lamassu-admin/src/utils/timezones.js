import * as R from 'ramda'

const getPossibleUTCDSTPairs = timezones =>
  R.map(
    it => ({
      utcOffset: it.utcOffset,
      dstOffset: it.dstOffset,
      utcOffsetStr: it.utcOffsetStr,
      dstOffsetStr: it.dstOffsetStr
    }),
    R.uniqBy(
      it => [it.utcOffset, it.dstOffset, it.utcOffsetStr, it.dstOffsetStr],
      timezones
    )
  )

const getFormattedTimezones = timezones =>
  R.sort(
    R.ascend(R.prop('utcOffset')),
    R.map(
      it => ({
        utcOffset: it.utcOffset,
        dstOffset: it.dstOffset,
        utcOffsetStr: it.utcOffsetStr,
        dstOffsetStr: it.dstOffsetStr,
        cities: R.map(
          ite => {
            const regionCityPair = R.split('/', ite.name)
            return {
              region: regionCityPair[0],
              city: R.replace(/_/g, ' ', regionCityPair[1]),
              country: ite.country
            }
          },
          R.filter(
            itx =>
              R.eqProps('utcOffset', it, itx) &&
              R.eqProps('dstOffset', it, itx) &&
              !R.isNil(itx.country) &&
              !R.includes('Etc', itx.name) &&
              R.includes('/', itx.name),
            timezones
          )
        )
      }),
      getPossibleUTCDSTPairs(timezones)
    )
  )

const getFinalTimezones = timezones => {
  const formattedTimezones = getFormattedTimezones(timezones)
  const nonEmptyTimezones = R.filter(
    it => !R.isEmpty(it.cities),
    formattedTimezones
  )
  const nonDuplicateCities = R.map(
    it => ({
      ...it,
      cities: R.uniqBy(R.prop('country'), R.uniqBy(R.prop('city'), it.cities))
    }),
    nonEmptyTimezones
  )
  return nonDuplicateCities
}

const buildLabel = tz => {
  return `(UTC${tz.utcOffsetStr}) ${R.map(it => it.city, tz.cities).join(', ')}`
}

const getTzLabels = timezones =>
  R.map(
    it => ({ label: buildLabel(it), code: it }),
    getFinalTimezones(timezones)
  )

export { getTzLabels }
