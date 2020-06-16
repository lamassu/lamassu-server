import { makeStyles, ClickAwayListener } from '@material-ui/core'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'
import { P } from 'src/components/typography'
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

const HelpTooltip = memo(({ children, width }) => {
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
        <HelpIcon />
        <Popper
          open={helpPopperOpen}
          anchorEl={helpPopperAnchorEl}
          placement="bottom"
          onClose={handleCloseHelpPopper}>
          <div className={classes.popoverContent}>
            <P>{children}</P>
          </div>
        </Popper>
      </button>
    </ClickAwayListener>
  )
})

export default HelpTooltip
