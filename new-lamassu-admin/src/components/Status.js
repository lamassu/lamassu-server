import React from 'react'
import Chip from '@material-ui/core/Chip'
import { makeStyles } from '@material-ui/core/styles'

import {
  tomato,
  mistyRose,
  pumpkin,
  secondaryColorDarker as spring4,
  inputFontWeight,
  spring3,
  smallestFontSize,
  inputFontFamily,
  spacer
} from '../styling/variables'

const colors = {
  error: tomato,
  warning: pumpkin,
  success: spring4
}

const backgroundColors = {
  error: mistyRose,
  warning: mistyRose,
  success: spring3
}

const useStyles = makeStyles({
  root: {
    borderRadius: spacer / 2,
    marginTop: spacer / 2,
    marginRight: spacer / 4,
    marginBottom: spacer / 2,
    marginLeft: spacer / 4,
    height: 18,
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
