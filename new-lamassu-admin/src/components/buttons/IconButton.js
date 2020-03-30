import { makeStyles, IconButton as IconB, SvgIcon } from '@material-ui/core'
import React from 'react'

const styles = {
  root: {
    '&:hover': {
      backgroundColor: 'inherit'
    }
  }
}

const useStyles = makeStyles(styles)

const IconButton = ({ children, onClick, ...props }) => {
  const classes = useStyles()
  return (
    <IconB
      {...props}
      classes={{ root: classes.root }}
      disableRipple
      onClick={onClick}>
      <SvgIcon>{children}</SvgIcon>
    </IconB>
  )
}

export default IconButton
