import { makeStyles, ClickAwayListener } from '@material-ui/core'
import * as R from 'ramda'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

const useStyles = makeStyles({
  transparentButton: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    cursor: 'pointer',
    marginTop: 4
  },
  relativelyPositioned: {
    position: 'relative'
  },
  safeSpace: {
    position: 'absolute',
    backgroundColor: '#0000',
    height: 40,
    left: '-50%',
    width: '200%'
  },
  popoverContent: ({ width }) => ({
    width,
    padding: [[10, 15]]
  })
})

const usePopperHandler = width => {
  const classes = useStyles({ width })
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
  }

  const openHelpPopper = event => {
    setHelpPopperAnchorEl(event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  return {
    classes,
    helpPopperAnchorEl,
    helpPopperOpen,
    handleOpenHelpPopper,
    openHelpPopper,
    handleCloseHelpPopper
  }
}

const HelpTooltip = memo(({ children, width }) => {
  const handler = usePopperHandler(width)

  return (
    <ClickAwayListener onClickAway={handler.handleCloseHelpPopper}>
      <div
        className={handler.classes.relativelyPositioned}
        onMouseLeave={handler.handleCloseHelpPopper}>
        {handler.helpPopperOpen && (
          <div className={handler.classes.safeSpace}></div>
        )}
        <button
          type="button"
          className={handler.classes.transparentButton}
          onMouseEnter={handler.openHelpPopper}>
          <HelpIcon />
        </button>
        <Popper
          open={handler.helpPopperOpen}
          anchorEl={handler.helpPopperAnchorEl}
          arrowEnabled={true}
          placement="bottom">
          <div className={handler.classes.popoverContent}>{children}</div>
        </Popper>
      </div>
    </ClickAwayListener>
  )
})

const HoverableTooltip = memo(({ parentElements, children, width }) => {
  const handler = usePopperHandler(width)

  return (
    <div>
      {!R.isNil(parentElements) && (
        <div
          onMouseEnter={handler.handleOpenHelpPopper}
          onMouseLeave={handler.handleCloseHelpPopper}>
          {parentElements}
        </div>
      )}
      {R.isNil(parentElements) && (
        <button
          type="button"
          onMouseEnter={handler.handleOpenHelpPopper}
          onMouseLeave={handler.handleCloseHelpPopper}
          className={handler.classes.transparentButton}>
          <HelpIcon />
        </button>
      )}
      <Popper
        open={handler.helpPopperOpen}
        anchorEl={handler.helpPopperAnchorEl}
        placement="bottom">
        <div className={handler.classes.popoverContent}>{children}</div>
      </Popper>
    </div>
  )
})

export { HoverableTooltip, HelpTooltip }
