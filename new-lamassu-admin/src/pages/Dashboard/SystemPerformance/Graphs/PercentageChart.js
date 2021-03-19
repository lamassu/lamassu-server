import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { Label1 } from 'src/components/typography/index'
import { java, neon, white } from 'src/styling/variables'

const styles = {
  wrapper: {
    display: 'flex',
    height: 130,
    marginTop: -8
  },
  percentageBox: {
    height: 130,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'pre'
  },
  label: {
    color: white
  },
  inColor: {
    backgroundColor: java
  },
  outColor: {
    backgroundColor: neon
  },
  other: {
    minWidth: '6px',
    borderRadius: 2
  },
  inWidth: {
    width: value => `${value}%`
  },
  outWidth: {
    width: value => `${100 - value}%`,
    marginRight: 4
  }
}

const useStyles = makeStyles(styles)

const PercentageChart = ({ cashIn, cashOut }) => {
  const value = cashIn || cashOut !== 0 ? cashIn : 50
  const classes = useStyles(value)

  const buildPercentageView = value => {
    if (value <= 15) return
    return <Label1 className={classes.label}>{value}%</Label1>
  }

  const percentageClasses = {
    [classes.percentageBox]: true,
    [classes.other]: value < 5 && value > 0
  }

  return (
    <div className={classes.wrapper}>
      <div
        className={classnames(
          percentageClasses,
          classes.outColor,
          classes.outWidth
        )}>
        {buildPercentageView(100 - value, 'cashOut')}
      </div>
      <div
        className={classnames(
          percentageClasses,
          classes.inColor,
          classes.inWidth
        )}>
        {buildPercentageView(value, 'cashIn')}
      </div>
    </div>
  )
}

export default PercentageChart
