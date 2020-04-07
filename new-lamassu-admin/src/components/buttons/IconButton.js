import { makeStyles, IconButton as IconB } from '@material-ui/core'
import React from 'react'

const styles = {
  label: ({ size }) => ({
    width: size,
    height: size
  }),
  root: {
    '&svg': {
      viewbox: null
    },
    '&:hover': {
      backgroundColor: 'inherit'
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
