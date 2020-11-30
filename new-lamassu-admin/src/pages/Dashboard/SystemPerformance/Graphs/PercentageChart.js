import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
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
  },
  cashIn: ({ value }) => ({
    width: `${value}%`,
    marginRight: 4
  }),
  cashOut: ({ value }) => ({
    width: `${100 - value}%`
  })
}

const useStyles = makeStyles(styles)

const PercentageChart = ({ cashIn, cashOut }) => {
  const value = cashIn || cashOut !== 0 ? cashIn : 50
  const classes = useStyles({ value })

  const buildPercentageView = (value, direction) => {
    const Operation = direction === 'cashIn' ? CashIn : CashOut
    if (value > 25) {
      return (
        <>
          <Operation />
          {value > 25 && <span className={classes.label}>{` ${value}%`}</span>}
        </>
      )
    }
    if (value >= 10) {
      return <Operation />
    }
  }

  return (
    <div className={classes.wrapper}>
      <div className={classnames(classes.percentageBox, classes.cashIn)}>
        {buildPercentageView(value, 'cashIn')}
      </div>
      <div className={classnames(classes.percentageBox, classes.cashOut)}>
        {buildPercentageView(100 - value, 'cashOut')}
      </div>
    </div>
  )
}

export default PercentageChart
