import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import Calendar from './Calendar'

import { ReactComponent as Arrow } from '../../styling/icons/arrow/download_logs.svg'
import { primaryColor, offColor, zircon } from '../../styling/variables'
import typographyStyles from '../typography/styles'

const { info1, label1, label2 } = typographyStyles

const dateContainerStyles = {
  wrapper: {
    height: 46,
    width: 99
  },
  container: {
    display: 'flex'
  },
  monthWeekDayContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    extend: label1,
    lineHeight: 1.33,
    color: primaryColor
  },
  bigNumber: {
    extend: info1,
    lineHeight: 1,
    marginRight: 7
  },
  monthYear: {
    extend: label2,
    lineHeight: 1.17,
    color: primaryColor
  },
  weekDay: {
    extend: label1,
    lineHeight: 1.33,
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: zircon,
    padding: [[0, 15]],
    minHeight: 70
  },
  arrowContainer: {
    position: 'absolute',
    left: 116,
    top: 26
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
