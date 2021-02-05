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
  }
}

const useStyles = makeStyles(styles)

const PercentageChart = ({ cashIn, cashOut }) => {
  const classes = useStyles()
  const value = cashIn || cashOut !== 0 ? cashIn : 50

  const buildPercentageView = value => {
    if (value > 15) {
      return <Label1 className={classes.label}>{` ${value}%`}</Label1>
    }
  }

  return (
    <div className={classes.wrapper}>
      <div
        className={classnames(
          classes.percentageBox,
          classes.inColor,
          // if value between [1, 4], percentage box should not go below 6 px and border radius is 2px
          // if value is 0 or 100, then width will be allowed to be 0px in one of the boxes, making it disappear
          value < 5 && value > 0 ? classes.other : null
        )}
        style={{ width: `${value}%`, marginRight: 4 }}>
        {buildPercentageView(value, 'cashIn')}
      </div>
      <div
        className={classnames(
          classes.percentageBox,
          classes.outColor,
          100 - value < 5 && 100 - value > 0 ? classes.other : null
        )}
        style={{ width: `${100 - value}%` }}>
        {buildPercentageView(100 - value, 'cashOut')}
      </div>
    </div>
  )
}

export default PercentageChart
