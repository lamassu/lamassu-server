import React, { memo } from 'react'

import Chip from '@material-ui/core/Chip'

import { withStyles } from '@material-ui/core/styles'
import { tomato, mistyRose, secondaryColorDarker as spring4, inputFontWeight, spring3, smallestFontSize, inputFontFamily } from '../styling/variables'

const green = theme => ({
  root: {
    backgroundColor: spring3,
    borderRadius: 4,
    margin: theme.spacing(0.5, 0.25),
    height: 18
  },
  label: {
    fontSize: smallestFontSize,
    color: spring4,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: 4,
    paddingLeft: 4
  }
})

const orange = theme => ({
  root: {
    backgroundColor: mistyRose,
    borderRadius: 4,
    margin: theme.spacing(0.5, 0.25),
    height: 18
  },
  label: {
    fontSize: smallestFontSize,
    color: '#ff7311',
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: 4,
    paddingLeft: 4
  }
})

const red = theme => ({
  root: {
    backgroundColor: mistyRose,
    borderRadius: 4,
    margin: theme.spacing(0.5, 0.25),
    height: 18
  },
  label: {
    fontSize: smallestFontSize,
    color: tomato,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: 4,
    paddingLeft: 4
  }
})

const LsChip = memo(({ classes, ...props }) => (
  <Chip size='small' classes={classes} {...props} />
))

const GreenChip = withStyles(green)(LsChip)
const OrangeChip = withStyles(orange)(LsChip)
const RedChip = withStyles(red)(LsChip)

const Status = ({ status }) => {
  return (
    <>
      {status.type === 'error' && <RedChip label={status.label}/>}
      {status.type === 'warning' && <OrangeChip label={status.label}/>}
      {status.type === 'success' && <GreenChip label={status.label}/>}
    </>
  )
}

const MainStatus = ({ statuses }) => {
  const mainStatus = statuses.find(s => s.type === 'error') || statuses.find(s => s.type === 'warning') || statuses[0]
  const plus = { label: `+${statuses.length - 1}`, type: mainStatus.type }

  return (
    <div>
      <Status status={mainStatus} />
      {statuses.length > 1 && <Status status={plus} />}
    </div>
  )
}

export { Status, MainStatus }
