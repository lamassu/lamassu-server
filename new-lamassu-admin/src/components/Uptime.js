import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'

import { onlyFirstToUpper } from '../utils/string'
import { secondaryColorLighter, secondaryColorDarker, offErrorColor, errorColor, offColor } from '../styling/variables'
import typographyStyles from './typography/styles'
const { label1 } = typographyStyles

const styles = {
  uptimeContainer: {
    display: 'inline-block',
    minWidth: 104,
    margin: [[0, 20]]
  },
  name: {
    extend: label1,
    paddingLeft: 4,
    color: offColor
  },
  uptime: {
    extend: label1,
    height: 24,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  running: {
    backgroundColor: secondaryColorLighter,
    color: secondaryColorDarker
  },
  notRunning: {
    backgroundColor: offErrorColor,
    color: errorColor
  }
}

const useStyles = makeStyles(styles)

const Uptime = ({ process, ...props }) => {
  const classes = useStyles()

  const uptimeClassNames = {
    [classes.uptime]: true,
    [classes.running]: process.state === 'RUNNING',
    [classes.notRunning]: process.state !== 'RUNNING'
  }

  const uptime = (time) => {
    if (time < 60) return `${time}s`
    if (time < 3600) return `${Math.floor(time / 60)}m`
    if (time < 86400) return `${Math.floor(time / 60 / 60)}h`
    return `${Math.floor(time / 60 / 60 / 24)}d`
  }

  return (
    <div className={classes.uptimeContainer}>
      <div className={classes.name}>{R.toLower(process.name)}</div>
      <div className={classnames(uptimeClassNames)}>
        {process.state === 'RUNNING' ? `Running for ${uptime(process.uptime)}` : onlyFirstToUpper(process.state)}
      </div>
    </div>
  )
}

export default Uptime
