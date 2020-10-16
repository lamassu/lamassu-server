import Chip from '@material-ui/core/Chip'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import {
  tomato,
  mistyRose,
  pumpkin,
  secondaryColorDarker as spring4,
  inputFontWeight,
  spring3,
  zircon,
  primaryColor,
  smallestFontSize,
  inputFontFamily,
  spacer,
  linen
} from '../styling/variables'

const colors = {
  error: tomato,
  warning: pumpkin,
  success: spring4,
  neutral: primaryColor
}

const backgroundColors = {
  error: mistyRose,
  warning: linen,
  success: spring3,
  neutral: zircon
}

const useStyles = makeStyles({
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
    paddingRight: spacer / 2,
    paddingLeft: spacer / 2,
    color: ({ type }) => colors[type]
  }
})

const Status = ({ status }) => {
  const classes = useStyles({ type: status.type })
  return <Chip type={status.type} label={status.label} classes={classes} />
}

const MainStatus = ({ statuses }) => {
  const mainStatus =
    statuses.find(s => s.type === 'error') ||
    statuses.find(s => s.type === 'warning') ||
    statuses[0]
  const plus = { label: `+${statuses.length - 1}`, type: mainStatus.type }

  return (
    <div>
      <Status status={mainStatus} />
      {statuses.length > 1 && <Status status={plus} />}
    </div>
  )
}

export { Status, MainStatus }
