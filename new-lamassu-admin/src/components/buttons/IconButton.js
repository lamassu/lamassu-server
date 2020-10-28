import { makeStyles, IconButton as IconB } from '@material-ui/core'
import React from 'react'

import { comet } from 'src/styling/variables'

const styles = {
  label: ({ size }) => ({
    width: size,
    height: size
  }),
  root: {
    '& svg': {
      flex: 1
    },
    '&:hover': {
      backgroundColor: 'inherit'
    },
    '&:hover rect': {
      stroke: comet
    },
    '&:hover polygon': {
      stroke: comet
    },
    '&:hover path': {
      stroke: comet
    }
  }
}

const useStyles = makeStyles(styles)

const IconButton = ({ size, children, onClick, ...props }) => {
  const classes = useStyles({ size })
  return (
    <IconB
      {...props}
      size="small"
      classes={{ root: classes.root, label: classes.label }}
      disableRipple
      onClick={onClick}>
      {children}
    </IconB>
  )
}

export default IconButton
