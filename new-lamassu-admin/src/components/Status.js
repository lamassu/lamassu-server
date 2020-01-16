import React, { memo } from 'react'
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

const styles = ({ type }) => ({
  root: {
    borderRadius: spacer / 2,
    marginTop: spacer / 2,
    marginRight: spacer / 4,
    marginBottom: spacer / 2,
    marginLeft: spacer / 4,
    height: 18,
    backgroundColor: backgroundColors[type]
  },
  label: {
    fontSize: smallestFontSize,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: spacer / 2,
    paddingLeft: spacer / 2,
    color: colors[type]
  }
})

const LsChip = memo(({ classes, ...props }) => (
  <Chip size="small" classes={classes} {...props} />
))

const StatusChip = ({ type, ...props }) => {
  // TODO: Move makeStyles to outside of the component
  const useStyles = makeStyles(styles({ type }))
  const classes = useStyles({ type })

  return <LsChip {...props} classes={classes}></LsChip>
}

const Status = ({ status }) => {
  return (
    <>
      <StatusChip type={status.type} label={status.label} />
    </>
  )
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
