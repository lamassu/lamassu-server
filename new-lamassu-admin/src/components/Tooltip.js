import { makeStyles, ClickAwayListener } from '@material-ui/core'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

const useStyles = makeStyles({
  transparentButton: {
    border: 'none',
    backgroundColor: 'transparent',
    marginTop: 4,
    outline: 'none',
    cursor: 'pointer'
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
    console.log(event)
    setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
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
    handleCloseHelpPopper
  }
}

const Tooltip = memo(({ children, width, Icon = HelpIcon }) => {
  const handler = usePopperHandler(width)

  return (
    <ClickAwayListener onClickAway={handler.handleCloseHelpPopper}>
      <div>
        <button
          type="button"
          className={handler.classes.transparentButton}
          onClick={handler.handleOpenHelpPopper}>
          <Icon />
        </button>
        <Popper
          open={handler.helpPopperOpen}
          anchorEl={handler.helpPopperAnchorEl}
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
      <div
        onMouseEnter={handler.handleOpenHelpPopper}
        onMouseLeave={handler.handleCloseHelpPopper}>
        {parentElements}
      </div>
      <Popper
        open={handler.helpPopperOpen}
        anchorEl={handler.helpPopperAnchorEl}
        placement="bottom">
        <div className={handler.classes.popoverContent}>{children}</div>
      </Popper>
    </div>
  )
})

export { Tooltip, HoverableTooltip }
