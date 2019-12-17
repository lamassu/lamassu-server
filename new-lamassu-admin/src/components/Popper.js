import React, { useState } from 'react'
import classnames from 'classnames'
import * as R from 'ramda'
import { makeStyles, Popper as MaterialPopper, Paper } from '@material-ui/core'

import { white } from '../styling/variables'

const Popover = ({ children, bgColor = white, arrowSize = 7, ...props }) => {
  const [arrowRef, setArrowRef] = useState(null)

  const styles = {
    popover: {
      zIndex: 1000,
      backgroundColor: bgColor,
      borderRadius: 4
    },
    arrow: {
      position: 'absolute',
      fontSize: arrowSize,
      width: '3em',
      height: '3em'
    },
    arrowBottom: {
      top: 0,
      width: 0,
      height: 0,
      borderLeft: [['2em', 'solid', 'transparent']],
      borderRight: [['2em', 'solid', 'transparent']],
      borderBottom: [['2em', 'solid', bgColor]],
      marginTop: '-1.9em'
    },
    arrowTop: {
      bottom: 0,
      width: 0,
      height: 0,
      borderLeft: [['2em', 'solid', 'transparent']],
      borderRight: [['2em', 'solid', 'transparent']],
      borderTop: [['2em', 'solid', bgColor]],
      marginBottom: '-1.9em'
    },
    arrowRight: {
      left: 0,
      width: 0,
      height: 0,
      borderTop: [['2em', 'solid', 'transparent']],
      borderBottom: [['2em', 'solid', 'transparent']],
      borderRight: [['2em', 'solid', bgColor]],
      marginLeft: '-1.9em'
    },
    arrowLeft: {
      right: 0,
      width: 0,
      height: 0,
      borderTop: [['2em', 'solid', 'transparent']],
      borderBottom: [['2em', 'solid', 'transparent']],
      borderLeft: [['2em', 'solid', bgColor]],
      marginRight: '-1.9em'
    },
    root: {
      backgroundColor: bgColor
    }
  }

  const useStyles = makeStyles(styles)

  const classes = useStyles()

  const arrowClasses = {
    [classes.arrow]: true,
    [classes.arrowBottom]: props.placement === 'bottom',
    [classes.arrowTop]: props.placement === 'top',
    [classes.arrowRight]: props.placement === 'right',
    [classes.arrowLeft]: props.placement === 'left'
  }

  const modifiers = R.merge(props.modifiers, {
    flip: {
      enabled: false
    },
    preventOverflow: {
      enabled: true,
      boundariesElement: 'scrollParent'
    },
    arrow: {
      enabled: true,
      element: arrowRef
    }
  })

  return (
    <>
      <MaterialPopper
        disablePortal={false}
        modifiers={modifiers}
        className={classes.popover}
        {...props}
      >
        <Paper className={classes.root}>
          <span className={classnames(arrowClasses)} ref={setArrowRef} />
          {children}
        </Paper>
      </MaterialPopper>
    </>
  )
}

export default Popover
