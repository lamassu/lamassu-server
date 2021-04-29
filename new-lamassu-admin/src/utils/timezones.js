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

const finalTimezones = timezones =>
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
            return { region: regionCityPair[0], city: regionCityPair[1] }
          },
          R.filter(
            itx =>
              R.eqProps('utcOffset', it, itx) &&
              R.eqProps('dstOffset', it, itx) &&
              R.includes('/', itx.name),
            timezones
          )
        )
      }),
      getPossibleUTCDSTPairs(timezones)
    )
  )

const buildLabel = tz => {
  return `UTC${tz.utcOffsetStr}${
    tz.utcOffset !== tz.dstOffset ? ' (Daylight Saving Time)' : ''
  }`
}

const getTzLabels = timezones =>
  R.map(it => ({ label: buildLabel(it), code: it }), finalTimezones(timezones))

export { getTzLabels }
