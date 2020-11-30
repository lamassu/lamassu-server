import { makeStyles } from '@material-ui/core'
import React from 'react'

import { ReactComponent as CashIn } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as CashOut } from 'src/styling/icons/direction/cash-out.svg'
import {
  zircon,
  fontSize3,
  fontSecondary,
  fontColor
} from 'src/styling/variables'

const styles = {
  wrapper: {
    display: 'flex',
    height: 130,
    marginTop: -8
  },
  percentageBox: {
    backgroundColor: zircon,
    height: 130,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'pre'
  },
  label: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: fontColor
  }
}

const useStyles = makeStyles(styles)

const PercentageChart = () => {
  const classes = useStyles()

  const value = 50

  const buildPercentageView = (value, direction) => {
    switch (direction) {
      case 'cashIn':
        if (value > 20) {
          return (
            <>
              <CashIn />
              <span className={classes.label}>{` ${value}%`}</span>
            </>
          )
        }
        return null
      case 'cashOut':
        if (value > 20) {
          return (
            <>
              <CashOut />
              <span className={classes.label}>{` ${value}%`}</span>
            </>
          )
        }
        return null
      default:
        return null
    }
  }

  return (
    <>
      <div className={classes.wrapper}>
        <div
          className={classes.percentageBox}
          style={{ width: `${value}%`, marginRight: 4 }}>
          {buildPercentageView(value, 'cashIn')}
        </div>
        <div
          className={classes.percentageBox}
          style={{ width: `${100 - value}%` }}>
          {buildPercentageView(100 - value, 'cashOut')}
        </div>
      </div>
    </>
  )
}

export default PercentageChart
