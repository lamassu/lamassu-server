import React, { useState } from 'react'
import moment from 'moment'
import { toInteger } from 'lodash/fp'
import { makeStyles } from '@material-ui/core/styles'

import { ReactComponent as Arrow } from '../../styling/icons/arrow/month_change.svg'
import { primaryColor, zircon, fontSecondary } from '../../styling/variables'
import typographyStyles from '../typography/styles'

import Tile from './Tile'

const { label2 } = typographyStyles

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    },
    fontFamily: fontSecondary,
    fontSize: 16,
    fontWeight: 500
  },
  table: {
    borderCollapse: 'collapse',
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
  const [currentDisplayedMonth, setCurrentDisplayedMonth] = useState(moment())

  const classes = useStyles()

  const weekdays = moment.weekdaysMin().map(day => day.slice(0, 1))
  const firstDayOfMonth = (month) => toInteger(moment(month).startOf('month').format('d'))
  const monthLength = (month) => toInteger(moment(month).endOf('month').format('D'))

  const monthdays = (month) => {
    const days = []

    const lastMonth = moment(month).subtract(1, 'month')
    for (let i = firstDayOfMonth(month) - 1; i >= 0; i--) {
      days.push(moment(lastMonth).endOf('month').subtract(i, 'days'))
    }
    for (let j = 0; j < monthLength(month); j++) {
      days.push(moment(month).startOf('month').add(j, 'days'))
    }
    const nextMonth = moment(month).add(1, 'month')
    for (let k = 0; days.length < 42; k++) {
      days.push(moment(nextMonth).startOf('month').add(k, 'days'))
    }

    return days
  }

  const getRow = (month, row) => monthdays(month).slice(row * 7 - 7, row * 7)

  const handleNavPrev = (currentMonth) => {
    const prevMonth = moment(currentMonth).subtract(1, 'month')
    if (!minDate) setCurrentDisplayedMonth(prevMonth)
    else setCurrentDisplayedMonth(prevMonth.isSameOrAfter(minDate, 'month') ? prevMonth : currentDisplayedMonth)
  }
  const handleNavNext = (currentMonth) => {
    const nextMonth = moment(currentMonth).add(1, 'month')
    if (!maxDate) setCurrentDisplayedMonth(nextMonth)
    else setCurrentDisplayedMonth(nextMonth.isSameOrBefore(maxDate, 'month') ? nextMonth : currentDisplayedMonth)
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.navbar}>
        <button onClick={() => handleNavPrev(currentDisplayedMonth)}>
          <Arrow />
        </button>
        <span>{`${currentDisplayedMonth.format('MMMM')} ${currentDisplayedMonth.format('YYYY')}`}</span>
        <button onClick={() => handleNavNext(currentDisplayedMonth)}>
          <Arrow transform='rotate(180)' />
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
          {[1, 2, 3, 4, 5, 6, 7].map((row, key) => (
            <tr key={key}>
              {getRow(currentDisplayedMonth, row).map((day, key) => (
                <td key={key} onClick={() => handleSelect(day, minDate, maxDate)}>
                  <Tile
                    isDisabled={(maxDate && day.isAfter(maxDate, 'day')) || (minDate && day.isBefore(minDate, 'day'))}
                    isLowerBound={day.isSame(props.from, 'day')}
                    isUpperBound={day.isSame(props.to, 'day')}
                    isBetween={day.isBetween(props.from, props.to, 'day', [])}
                  >
                    {day.format('D')}
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
