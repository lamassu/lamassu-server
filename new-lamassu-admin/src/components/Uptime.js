import { makeStyles } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import * as R from 'ramda'
import React from 'react'

import {
  secondaryColorLighter,
  secondaryColorDarker,
  offErrorColor,
  errorColor,
  offColor,
  inputFontWeight,
  smallestFontSize,
  inputFontFamily,
  spacer
} from 'src/styling/variables'
import { onlyFirstToUpper } from 'src/utils/string'

import typographyStyles from './typography/styles'
const { label1 } = typographyStyles

const colors = {
  running: secondaryColorDarker,
  notRunning: offErrorColor
}

const backgroundColors = {
  running: secondaryColorLighter,
  notRunning: errorColor
}

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
  }
}

const useStyles = makeStyles(styles)

const useChipStyles = makeStyles({
  root: {
    borderRadius: spacer / 2,
    marginTop: spacer / 2,
    marginRight: spacer / 4,
    marginBottom: spacer / 2,
    marginLeft: spacer / 4,
    height: spacer * 3,
    backgroundColor: ({ type }) => backgroundColors[type]
  },
  label: {
    fontSize: smallestFontSize,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    padding: [[spacer / 2, spacer]],
    color: ({ type }) => colors[type]
  }
})

const Uptime = ({ process, ...props }) => {
  const classes = useStyles()

  const uptime = time => {
    if (time < 60) return `${time}s`
    if (time < 3600) return `${Math.floor(time / 60)}m`
    if (time < 86400) return `${Math.floor(time / 60 / 60)}h`
    return `${Math.floor(time / 60 / 60 / 24)}d`
  }

  return (
    <div className={classes.uptimeContainer}>
      <div className={classes.name}>{R.toLower(process.name)}</div>
      <Chip
        label={
          process.state === 'RUNNING'
            ? `Running for ${uptime(process.uptime)}`
            : onlyFirstToUpper(process.state)
        }
        classes={useChipStyles({
          type: process.state === 'RUNNING' ? 'running' : 'notRunning'
        })}
      />
    </div>
  )
}

export default Uptime
