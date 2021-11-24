import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import {
  differenceInDays,
  differenceInMonths,
  isSameMonth,
  set
} from 'date-fns/fp'
import React, { useState, useEffect } from 'react'

import Calendar from './Calendar'

const styles = {
  wrapper: {
    backgroundColor: 'white',
    borderRadius: 10
  }
}

const useStyles = makeStyles(styles)

const DateRangePicker = ({ minDate, maxDate, className, onRangeChange }) => {
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)

  useEffect(() => {
    onRangeChange(from, to)
  }, [from, onRangeChange, to])

  const classes = useStyles()

  const handleSelect = (day, minDate, maxDate) => {
    if (
      (maxDate && differenceInDays(maxDate, day) > 0) ||
      (minDate && differenceInDays(day, minDate) > 0)
    )
      return

    if (from && !to && differenceInDays(day, from) > 0) {
      setTo(from)
      setFrom(day)
      return
    }

    if (
      from &&
      !to &&
      (isSameMonth(from, day) || differenceInMonths(from, day) > 0)
    ) {
      setTo(
        set({ hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }, day)
      )
      return
    }

    setFrom(day)
    setTo(null)
  }

  return (
    <>
      <div className={classnames(classes.wrapper, className)}>
        <Calendar
          from={from}
          to={to}
          minDate={minDate}
          maxDate={maxDate}
          handleSelect={handleSelect}
        />
      </div>
    </>
  )
}

export default DateRangePicker
