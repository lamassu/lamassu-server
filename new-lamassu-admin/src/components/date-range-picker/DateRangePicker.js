import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import Calendar from './Calendar'
import { ReactComponent as Arrow } from '../../styling/icons/arrow/download_logs.svg'

import { primaryColor, offColor, zircon } from '../../styling/variables'

import typographyStyles from '../typography/styles'
const { info1, label, label3 } = typographyStyles

const dateContainerStyles = {
  wrapper: {
    minWidth: 118
  },
  container: {
    display: 'flex'
  },
  monthWeekDayContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    extend: label,
    color: primaryColor
  },
  bigNumber: {
    extend: info1,
    marginRight: 7
  },
  monthYear: {
    extend: label3,
    color: primaryColor
  },
  weekDay: {
    extend: label,
    lineHeight: 1,
    color: offColor
  }
}

const dateContainerUseStyles = makeStyles(dateContainerStyles)

const DateContainer = ({ date, children, ...props }) => {
  const classes = dateContainerUseStyles()

  return (
    <div className={classes.wrapper}>
      <div className={classes.label}>{children}</div>
      {date &&
        <>
          <div className={classes.container}>
            <div className={classes.bigNumber}>{date.format('D')}</div>
            <div className={classes.monthWeekDayContainer}>
              <span className={classes.monthYear}>{`${date.format('MMM')} ${date.format('YYYY')}`}</span>
              <span className={classes.weekDay}>{date.format('dddd')}</span>
            </div>
          </div>
        </>}
    </div>
  )
}

const styles = {
  wrapper: {
    backgroundColor: 'white',
    borderRadius: 10
  },
  dateThingyContainer: {
    height: 80,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: zircon,
    padding: [[5, 15, 0, 15]]
  },
  arrowContainer: {
    width: 39,
    display: 'flex',
    alignSelf: 'center',
    alignItems: 'center'
  },
  arrow: {
    margin: 'auto'
  }
}

const useStyles = makeStyles(styles)

const DateRangePicker = ({ minDate, maxDate, className, handleChange, ...props }) => {
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)

  useEffect(() => {
    handleChange(from, to)
  }, [to])

  const classes = useStyles()

  const handleSelect = (day, minDate, maxDate) => {
    if ((maxDate && day.isAfter(maxDate, 'day')) || (minDate && day.isBefore(minDate, 'day'))) return
    if (from && !to) {
      if (day.isBefore(from, 'day')) {
        setTo(from)
        setFrom(day)
      } else {
        setTo(day)
      }
    } else {
      setFrom(day)
      setTo(null)
    }
  }

  return (
    <>
      <div className={classnames(classes.wrapper, className)}>
        <div className={classes.dateThingyContainer}>
          <DateContainer date={from}>From</DateContainer>
          <div className={classes.arrowContainer}>
            <Arrow className={classes.arrow} />
          </div>
          <DateContainer date={to}>To</DateContainer>
        </div>
        <Calendar from={from} to={to} minDate={minDate} maxDate={maxDate} handleSelect={handleSelect} />
      </div>
    </>
  )
}

export default DateRangePicker
