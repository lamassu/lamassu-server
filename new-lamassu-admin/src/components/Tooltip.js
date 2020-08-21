import { makeStyles, ClickAwayListener } from '@material-ui/core'
import React, { useState, memo } from 'react'

import Popper from 'src/components/Popper'
import { FeatureButton } from 'src/components/buttons'

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

const Tooltip = memo(
  ({
    enableOver = false,
    enableClick = false,
    className,
    Button,
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
        <>
          <Button
            Icon={Button === FeatureButton && Icon}
            className={className}
            onPointerOver={event => enableOver && handleOpenHelpPopper(event)}
            onClick={event => enableClick && handleOpenHelpPopper(event)}
            {...props}>
            {Button !== FeatureButton && <Icon></Icon>}
          </Button>
          <Popper
            open={helpPopperOpen}
            anchorEl={helpPopperAnchorEl}
            placement="bottom"
            onClose={handleCloseHelpPopper}>
            <div className={classes.popoverContent}>{children}</div>
          </Popper>
        </>
      </ClickAwayListener>
    )
  }
)

export default Tooltip
