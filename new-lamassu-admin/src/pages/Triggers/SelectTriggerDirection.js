import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import Popper from 'src/components/Popper'
import { RadioGroup } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const SelectTriggerDirection = () => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [radioGroupValue, setRadioGroupValue] = useState('both')

  const classes = useStyles()

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const handleRadioButtons = newValue => {
    setRadioGroupValue(newValue)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  const radioButtonOptions = [
    { display: 'Both', code: 'both' },
    { display: 'Only cash-in', code: 'cash-in' },
    { display: 'Only cash-out', code: 'cash-out' }
  ]

  return (
    <div className={classes.columnWrapper}>
      <div className={classes.rowWrapper}>
        <H4>In which type of transactions will it trigger?</H4>
        <div className={classes.transparentButton}>
          <button onClick={handleOpenHelpPopper}>
            <HelpIcon />
            <Popper
              open={helpPopperOpen}
              anchorEl={helpPopperAnchorEl}
              placement="bottom"
              onClose={handleCloseHelpPopper}>
              <div className={classes.popoverContent}>
                <P>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
                  tempor velit a dolor ultricies posuere. Proin massa sapien,
                  euismod quis auctor vel, blandit in enim.
                </P>
              </div>
            </Popper>
          </button>
        </div>
      </div>
      <div className={classes.radioGroupWrapper}>
        <RadioGroup
          options={radioButtonOptions}
          value={radioGroupValue}
          onChange={event => handleRadioButtons(event.target.value)}
          className={classnames(
            classes.radioButtons,
            classes.stepOneRadioButtons
          )}
        />
      </div>
    </div>
  )
}
export default SelectTriggerDirection
