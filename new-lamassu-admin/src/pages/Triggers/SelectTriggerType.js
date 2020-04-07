import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'

import { H4, TL1, P } from 'src/components/typography'
import { RadioGroup, TextInput } from 'src/components/inputs'
import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const SelectTriggerType = ({ fiatCurrencyCode }) => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [radioGroupValue, setRadioGroupValue] = useState('amount')

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
    { label: 'Transaction amount', value: 'amount' },
    { label: 'Transaction velocity', value: 'velocity' },
    { label: 'Transaction volume', value: 'volume' },
    { label: 'Consecutive days', value: 'days' }
  ]

  return (
    <div className={classes.columnWrapper}>
      <div className={classes.rowWrapper}>
        <H4>Choose trigger type</H4>
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
            classes.stepTwoRadioButtons
          )}
        />
      </div>
      <H4>Threshold</H4>
      <div className={classes.rowWrapper}>
        {/* TODO: allow only monetary values */}
        <TextInput large className={classes.textInput} />
        <TL1>{fiatCurrencyCode}</TL1>
      </div>
    </div>
  )
}

export default SelectTriggerType
