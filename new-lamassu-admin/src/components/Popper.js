import { makeStyles, Popper as MaterialPopper, Paper } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState } from 'react'

import { white } from 'src/styling/variables'

const Popover = ({
  children,
  bgColor = white,
  arrowSize = 6,
  className,
  ...props
}) => {
  const [arrowRef, setArrowRef] = useState(null)

  const styles = {
    popover: {
      zIndex: 3000,
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
      marginTop: '-1.9em',
      '&:after': {
        zIndex: -10,
        content: '""',
        position: 'absolute',
        width: arrowSize * 3,
        height: arrowSize * 3,
        marginLeft: 0,
        bottom: 0,
        top: 'calc(50% - 0px)',
        left: 0,
        border: '5px solid #fff',
        borderColor: 'transparent transparent #fff #fff',
        transformOrigin: '0 0',
        transform: 'rotate(45deg)',
        boxShadow:
          '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)'
      }
    },
    arrowTop: {
      bottom: 0,
      width: 0,
      height: 0,
      borderLeft: [['2em', 'solid', 'transparent']],
      borderRight: [['2em', 'solid', 'transparent']],
      borderTop: [['2em', 'solid', bgColor]],
      marginBottom: '-1.9em',
      '&:after': {
        zIndex: -10,
        content: '""',
        position: 'absolute',
        width: arrowSize * 3,
        height: arrowSize * 3,
        marginLeft: 0,
        bottom: 0,
        top: -(arrowSize * 4 + 2),
        left: 0,
        border: '5px solid #fff',
        borderColor: 'transparent transparent #fff #fff',
        transformOrigin: '0 0',
        transform: 'rotate(45deg)',
        boxShadow:
          '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)'
      }
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

  const getArrowClasses = placement => ({
    [classes.arrow]: true,
    [classes.arrowBottom]: placement === 'bottom',
    [classes.arrowTop]: placement === 'top',
    [classes.arrowRight]: placement === 'right',
    [classes.arrowLeft]: placement === 'left'
  })

  const flipPlacements = {
    top: ['bottom'],
    bottom: ['top'],
    left: ['right'],
    right: ['left']
  }

  const modifiers = R.mergeDeepLeft(props.modifiers, {
    flip: {
      enabled: R.defaultTo(false, props.flip),
      allowedAutoPlacements: flipPlacements[props.placement],
      boundary: 'clippingParents'
    },
    preventOverflow: {
      enabled: R.defaultTo(true, props.preventOverflow),
      boundariesElement: 'scrollParent'
    },
    offset: {
      enabled: true,
      offset: '0, 10'
    },
    arrow: {
      enabled: R.defaultTo(true, props.showArrow),
      element: arrowRef
    },
    computeStyle: {
      gpuAcceleration: false
    }
  })

  if (props.preventOverflow === false) {
    modifiers.hide = {
      enabled: false
    }
  }

  return (
    <>
      <MaterialPopper
        disablePortal={false}
        modifiers={modifiers}
        className={classes.popover}
        {...props}>
        {({ placement }) => (
          <Paper className={classnames(classes.root, className)}>
            <span
              className={classnames(getArrowClasses(placement))}
              ref={setArrowRef}
            />
            {children}
          </Paper>
        )}
      </MaterialPopper>
    </>
  )
}

export default Popover
