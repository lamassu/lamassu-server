import { makeStyles, ClickAwayListener } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'

const useStyles = makeStyles({
  transparentButton: {
    border: 'none',
    backgroundColor: 'transparent',
    marginTop: 4,
    cursor: 'pointer'
  },
  preventDefaultTooltip: {
    pointerEvents: 'none'
  },
  popoverContent: ({ width }) => ({
    width,
    padding: [[10, 15]]
  })
})

const Tooltip = memo(
  ({
    enableOver = false,
    enableClick = false,
    className,
    Icon,
    children,
    width,
    ...props
  }) => {
    const classes = useStyles({ width })
    const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)

    const handleOpenHelpPopper = event => {
      setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
    }

    const handleCloseHelpPopper = () => {
      setHelpPopperAnchorEl(null)
    }

    const helpPopperOpen = Boolean(helpPopperAnchorEl)

    return (
      <ClickAwayListener onClickAway={handleCloseHelpPopper}>
        <button
          type={'button'}
          className={classnames(className, classes.transparentButton)}
          onPointerOver={event => enableOver && handleOpenHelpPopper(event)}
          onClick={event => enableClick && handleOpenHelpPopper(event)}
          {...props}>
          <Icon className={classes.preventDefaultTooltip}></Icon>
          <Popper
            open={helpPopperOpen}
            anchorEl={helpPopperAnchorEl}
            placement="bottom"
            onClose={handleCloseHelpPopper}>
            <div className={classes.popoverContent}>{children}</div>
          </Popper>
        </button>
      </ClickAwayListener>
    )
  }
)

export default Tooltip
