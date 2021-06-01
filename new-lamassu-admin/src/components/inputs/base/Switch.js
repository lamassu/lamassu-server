import Switch from '@material-ui/core/Switch'
import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import {
  secondaryColor,
  offColor,
  disabledColor,
  disabledColor2
} from '../../../styling/variables'

const useStyles = makeStyles(theme => ({
  root: {
    width: 32,
    height: 20,
    padding: 0,
    margin: theme.spacing(1)
  },
  switchBase: {
    padding: 2,
    '&$disabled': {
      color: disabledColor2,
      '& + $track': {
        backgroundColor: disabledColor,
        opacity: 1
      }
    },
    '&$checked': {
      transform: 'translateX(58%)',
      color: theme.palette.common.white,
      '&$disabled': {
        color: disabledColor2
      },
      '& + $track': {
        backgroundColor: secondaryColor,
        opacity: 1,
        border: 'none'
      }
    },
    '&$focusVisible $thumb': {
      border: '6px solid #fff'
    }
  },
  thumb: {
    width: 16,
    height: 16
  },
  track: {
    borderRadius: 17,
    border: 'none',
    backgroundColor: offColor,
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border'])
  },
  disabled: {},
  checked: {},
  focusVisible: {}
}))

const SwitchInput = memo(({ ...props }) => {
  const classes = useStyles()
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
        disabled: classes.disabled
      }}
      {...props}
    />
  )
})

export default SwitchInput
