import { makeStyles } from '@material-ui/core/styles'
import {
  add,
  differenceInMonths,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isSameDay,
  isSameMonth,
  lastDayOfMonth,
  startOfMonth,
  startOfWeek,
  sub
} from 'date-fns'
import * as R from 'ramda'
import React, { useState } from 'react'

import typographyStyles from 'src/components/typography/styles'
import { ReactComponent as Arrow } from 'src/styling/icons/arrow/month_change.svg'
import { ReactComponent as RightArrow } from 'src/styling/icons/arrow/month_change_right.svg'
import { primaryColor, zircon } from 'src/styling/variables'

import Tile from './Tile'

const { p, label2 } = typographyStyles

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  button: {
    outline: 'none'
  },
  navbar: {
    extend: p,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: [[15, 15]],
    color: primaryColor,
    '& button': {
      display: 'flex',
      alignItems: 'center',
      padding: 0,
      border: 'none',
      backgroundColor: zircon,
      cursor: 'pointer',
      borderRadius: '50%',
      width: 20,
      height: 20,
      position: 'relative',
      overflow: 'hidden',
      '& svg': {
        position: 'absolute',
        left: 0
      }
    }
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    color: primaryColor,
    '& tr': {
      '&:first-child': {
        paddingLeft: 5
      },
      '&:last-child': {
        paddingRight: 5
      }
    },
    '& th, & td': {
      margin: 0,
      padding: [[3, 0, 3, 0]]
    },
    '& th': {
      extend: label2
    }
  }
}

const useStyles = makeStyles(styles)

const Calendar = ({ minDate, maxDate, handleSelect, ...props }) => {
  const [currentDisplayedMonth, setCurrentDisplayedMonth] = useState(new Date())

  const classes = useStyles()

  const weekdays = Array.from(Array(7)).map((_, i) =>
    format(add(startOfWeek(new Date()), { days: i }), 'EEEEE')
  )

  const monthLength = month => getDaysInMonth(month)

  const monthdays = month => {
    const lastMonth = sub(month, { months: 1 })
    const lastMonthRange = R.range(0, getDay(startOfMonth(month))).reverse()
    const lastMonthDays = R.map(i =>
      sub(lastDayOfMonth(lastMonth), { days: i })
    )(lastMonthRange)

    const thisMonthRange = R.range(0, monthLength(month))
    const thisMonthDays = R.map(i => add(startOfMonth(month), { days: i }))(
      thisMonthRange
    )

    const nextMonth = add(month, { months: 1 })
    const nextMonthRange = R.range(
      0,
      42 - lastMonthDays.length - thisMonthDays.length
    )
    const nextMonthDays = R.map(i => add(startOfMonth(nextMonth), { days: i }))(
      nextMonthRange
    )

    return R.concat(R.concat(lastMonthDays, thisMonthDays), nextMonthDays)
  }

  const getRow = (month, row) => monthdays(month).slice(row * 7 - 7, row * 7)

  const handleNavPrev = currentMonth => {
    const prevMonth = sub(currentMonth, { months: 1 })
    if (!minDate) setCurrentDisplayedMonth(prevMonth)
    else {
      setCurrentDisplayedMonth(
        isSameMonth(prevMonth, minDate) ||
          differenceInMonths(prevMonth, minDate) > 0
          ? prevMonth
          : currentDisplayedMonth
      )
    }
  }
  const handleNavNext = currentMonth => {
    const nextMonth = add(currentMonth, { months: 1 })
    if (!maxDate) setCurrentDisplayedMonth(nextMonth)
    else {
      setCurrentDisplayedMonth(
        isSameMonth(nextMonth, maxDate) ||
          differenceInMonths(maxDate, nextMonth) > 0
          ? nextMonth
          : currentDisplayedMonth
      )
    }
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.navbar}>
        <button
          className={classes.button}
          onClick={() => handleNavPrev(currentDisplayedMonth)}>
          <Arrow />
        </button>
        <span>
          {`${format(currentDisplayedMonth, 'MMMM')} ${format(
            currentDisplayedMonth,
            'yyyy'
          )}`}
        </span>
        <button
          className={classes.button}
          onClick={() => handleNavNext(currentDisplayedMonth)}>
          <RightArrow />
        </button>
      </div>
      <table className={classes.table}>
        <thead>
          <tr>
            {weekdays.map((day, key) => (
              <th key={key}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {R.range(1, 8).map((row, key) => (
            <tr key={key}>
              {getRow(currentDisplayedMonth, row).map((day, key) => (
                <td
                  key={key}
                  onClick={() => handleSelect(day, minDate, maxDate)}>
                  <Tile
                    isDisabled={
                      (maxDate && isAfter(day, maxDate)) ||
                      (minDate && isAfter(minDate, day))
                    }
                    isLowerBound={isSameDay(day, props.from)}
                    isUpperBound={isSameDay(day, props.to)}
                    isBetween={
                      isAfter(day, props.from) && isAfter(props.to, day)
                    }>
                    {format(day, 'd')}
                  </Tile>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Calendar
