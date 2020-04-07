import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'

import { H4, P } from 'src/components/typography'
import { RadioGroup } from 'src/components/inputs'
import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const SelectTriggerRequirements = () => {
  const [
    requirementHelpPopperAnchorEl,
    setRequirementHelpPopperAnchorEl
  ] = useState(null)
  const [typeHelpPopperAnchorEl, setTypeHelpPopperAnchorEl] = useState(null)
  const [requirementRadioGroupValue, setRequirementRadioGroupValue] = useState(
    'sms'
  )
  const [typeRadioGroupValue, setTypeRadioGroupValue] = useState('automatic')

  const classes = useStyles()

  const handleOpenRequirementHelpPopper = event => {
    setRequirementHelpPopperAnchorEl(
      requirementHelpPopperAnchorEl ? null : event.currentTarget
    )
  }

  const handleOpenTypeHelpPopper = event => {
    setTypeHelpPopperAnchorEl(
      typeHelpPopperAnchorEl ? null : event.currentTarget
    )
  }

  const handleCloseRequirementHelpPopper = () => {
    setRequirementHelpPopperAnchorEl(null)
  }

  const handleCloseTypeHelpPopper = () => {
    setTypeHelpPopperAnchorEl(null)
  }

  const handleRequirementRadioButtons = newValue => {
    setRequirementRadioGroupValue(newValue)
  }

  const handleTypeRadioButtons = newValue => {
    setTypeRadioGroupValue(newValue)
  }

  const requirementHelpPopperOpen = Boolean(requirementHelpPopperAnchorEl)
  const typeHelpPopperOpen = Boolean(typeHelpPopperAnchorEl)

  const requirementRadioButtonOptions = [
    { label: 'SMS verification', value: 'sms' },
    { label: 'ID card image', value: 'id-card' },
    { label: 'ID data', value: 'id-data' },
    { label: 'Customer camera', value: 'camera' },
    { label: 'Sanctions', value: 'sanctions' },
    { label: 'Super user', value: 'super-user' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Block', value: 'block' }
  ]

  const typeRadioButtonOptions = [
    { label: 'Fully automatic', value: 'automatic' },
    { label: 'Semi automatic', value: 'semi-automatic' },
    { label: 'Manual', value: 'manual' }
  ]

  return (
    <div className={classes.columnWrapper}>
      <div className={classes.rowWrapper}>
        <H4>Choose a requirement</H4>
        <div className={classes.transparentButton}>
          <button onClick={handleOpenRequirementHelpPopper}>
            <HelpIcon />
            <Popper
              open={requirementHelpPopperOpen}
              anchorEl={requirementHelpPopperAnchorEl}
              placement="bottom"
              onClose={handleCloseRequirementHelpPopper}>
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
      <RadioGroup
        options={requirementRadioButtonOptions}
        value={requirementRadioGroupValue}
        onChange={event => handleRequirementRadioButtons(event.target.value)}
        className={classnames(
          classes.radioButtons,
          classes.stepThreeRadioButtons
        )}
      />
      <div className={classes.rowWrapper}>
        <H4>Choose trigger type</H4>
        <div className={classes.transparentButton}>
          <button onClick={handleOpenTypeHelpPopper}>
            <HelpIcon />
            <Popper
              open={typeHelpPopperOpen}
              anchorEl={typeHelpPopperAnchorEl}
              placement="bottom"
              onClose={handleCloseTypeHelpPopper}>
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
      <RadioGroup
        options={typeRadioButtonOptions}
        value={typeRadioGroupValue}
        onChange={event => handleTypeRadioButtons(event.target.value)}
        className={classnames(
          classes.radioButtons,
          classes.stepThreeRadioButtons
        )}
      />
    </div>
  )
}

export default SelectTriggerRequirements
