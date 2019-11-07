import React from 'react'
import { makeStyles, Popover as MaterialPopover } from '@material-ui/core'

const styles = {
  arrow: {
    width: 0,
    height: 0,
    position: 'absolute',
    borderStyle: 'solid',
    margin: 5,
    borderWidth: [[0, 15, 18, 15]],
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    top: -18,
    left: 138,
    marginTop: 0,
    marginBottom: 0,
    borderColor: '#ffffff'
  },
  paper: {
    overflow: 'visible'
  }
}

const useStyles = makeStyles(styles)

const Popover = ({ children, ...props }) => {
  const classes = useStyles()

  return (
    <MaterialPopover
      classes={{
        paper: classes.paper
      }}
      {...props}
    >
      {children}
      <div class={classes.arrow} />
    </MaterialPopover>
  )
}

export default Popover
