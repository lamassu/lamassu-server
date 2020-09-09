import { makeStyles, ClickAwayListener } from '@material-ui/core'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

const useStyles = makeStyles({
  transparentButton: {
    border: 'none',
    backgroundColor: 'transparent',
    marginTop: 4,
    cursor: 'pointer'
  },
  popoverContent: ({ width }) => ({
    width,
    padding: [[10, 15]]
  })
})

const Tooltip = memo(({ children, width, Icon = HelpIcon }) => {
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
        className={classes.transparentButton}
        onClick={handleOpenHelpPopper}>
        <Icon />
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
})

export default Tooltip
