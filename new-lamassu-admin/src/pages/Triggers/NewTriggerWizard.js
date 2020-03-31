import React, { useState } from 'react'
import { makeStyles, Paper } from '@material-ui/core'

import { H2, P } from 'src/components/typography'
// import { Button } from 'src/components/buttons'
import Popper from 'src/components/Popper'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const NewTriggerWizard = ({ handleClose, save }) => {
  const [mainHelpPopperAnchorEl, setMainHelpPopperAnchorEl] = useState(null)

  const classes = useStyles()

  const handleOpenMainHelpPopper = event => {
    setMainHelpPopperAnchorEl(
      mainHelpPopperAnchorEl ? null : event.currentTarget
    )
  }

  const handleCloseMainHelpPopper = () => {
    setMainHelpPopperAnchorEl(null)
  }

  const mainHelpPopperOpen = Boolean(mainHelpPopperAnchorEl)

  console.log(mainHelpPopperOpen)

  return (
    <Paper className={classes.paper}>
      <button onClick={handleClose}>
        <CloseIcon />
      </button>
      <div className={classes.modalHeader}>
        <div className={classes.rowWrapper}>
          <H2>New Compliance Trigger</H2>
          <div className={classes.transparentButton}>
            <button onClick={handleOpenMainHelpPopper}>
              <HelpIcon />
              <Popper
                open={mainHelpPopperOpen}
                anchorEl={mainHelpPopperAnchorEl}
                placement="bottom"
                onClose={handleCloseMainHelpPopper}>
                <div className={classes.popoverContent}>
                  <P>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Morbi tempor velit a dolor ultricies posuere. Proin massa
                    sapien, euismod quis auctor vel, blandit in enim.
                  </P>
                </div>
              </Popper>
            </button>
          </div>
        </div>
      </div>
      <div className={classes.modalBody}></div>
    </Paper>
  )
}

export { NewTriggerWizard }
