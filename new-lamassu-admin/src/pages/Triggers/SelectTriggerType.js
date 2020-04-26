import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import Popper from 'src/components/Popper'
import { RadioGroup, TextInput } from 'src/components/inputs'
import { H4, TL1, P } from 'src/components/typography'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const SelectTriggerType = ({ fiatCurrencyCode }) => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [radioGroupValue, setRadioGroupValue] = useState('amount')
  const [thresholdValue, setThresholdValue] = useState('')
  const [thresholdError, setThresholdError] = useState(false)

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

  const validateThresholdInputIsPositiveInteger = value => {
    if (
      (parseFloat(value) === value >>> 0 && !value.includes('.')) ||
      value === ''
    ) {
      setThresholdValue(value)
      setThresholdError(value === '')
    }
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  const radioButtonOptions = [
    { display: 'Transaction amount', code: 'amount' },
    { display: 'Transaction velocity', code: 'velocity' },
    { display: 'Transaction volume', code: 'volume' },
    { display: 'Consecutive days', code: 'days' }
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
        <TextInput
          className={classes.textInput}
          onChange={event =>
            validateThresholdInputIsPositiveInteger(event.target.value)
          }
          error={thresholdError}
          size="lg"
          value={thresholdValue}
        />
        <TL1>{fiatCurrencyCode}</TL1>
      </div>
    </div>
  )
}

export default SelectTriggerType
