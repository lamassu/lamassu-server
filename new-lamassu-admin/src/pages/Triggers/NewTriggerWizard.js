import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'

import { H2, H4, TL1, P } from 'src/components/typography'
import { RadioGroup, TextInput } from 'src/components/inputs'
import { Button } from 'src/components/buttons'
import Popper from 'src/components/Popper'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'
import { ReactComponent as CompleteIcon } from 'src/styling/icons/stage/spring/complete.svg'
import { ReactComponent as CurrentIcon } from 'src/styling/icons/stage/spring/current.svg'
import { ReactComponent as EmptyIcon } from 'src/styling/icons/stage/spring/empty.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const SelectTriggerDirection = () => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [radioGroupValue, setRadioGroupValue] = useState('both')

  const classes = useStyles()

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const handleRadioButtons = newValue => {
    setRadioGroupValue(newValue)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  const radioButtonOptions = [
    { label: 'Both', value: 'both' },
    { label: 'Only cash-in', value: 'cash-in' },
    { label: 'Only cash-out', value: 'cash-out' }
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
      <div class={classes.radioGroupWrapper}>
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

const SelectTriggerType = () => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [radioGroupValue, setRadioGroupValue] = useState('amount')

  const classes = useStyles()

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(event.currentTarget)
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
      <div class={classes.radioGroupWrapper}>
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
        {/* TODO: how should we define the fiat code? */}
        <TL1>EUR</TL1>
      </div>
    </div>
  )
}

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
    setRequirementHelpPopperAnchorEl(event.currentTarget)
  }

  const handleOpenTypeHelpPopper = event => {
    setTypeHelpPopperAnchorEl(event.currentTarget)
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
        {/* TODO: why there's a trigger type property two times? Here and on the prior step */}
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

const Wizard = ({ nextStepText, finalStepText, finish, children }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const classes = useStyles()

  const handleMoveToNextStep = nextStepIndex => {
    const finalStepIndex = children.length - 1

    if (nextStepIndex > finalStepIndex) {
      finish()
    } else {
      setCurrentStepIndex(nextStepIndex)
    }
  }

  const currentStep = children[currentStepIndex]
  const finalStepIndex = children.length - 1
  const isFinalStep = currentStepIndex === finalStepIndex

  return (
    <div className={classes.columnWrapper}>
      {/* TODO: wizard steps icons are a little strange... */}
      <div className={classes.wizardStepsWrapper}>
        {children.map((e, i) => {
          const elementToRender = []

          if (i < currentStepIndex) elementToRender.push(<CompleteIcon />)
          else if (i === currentStepIndex) elementToRender.push(<CurrentIcon />)
          else elementToRender.push(<EmptyIcon />)

          if (i < currentStepIndex)
            elementToRender.push(<div className={classes.reachedStepLine} />)
          else if (i < finalStepIndex)
            elementToRender.push(<div className={classes.unreachedStepLine} />)

          return elementToRender
        })}
      </div>
      {currentStep}
      <div className={classes.bottomRightAligned}>
        <Button onClick={() => handleMoveToNextStep(currentStepIndex + 1)}>
          {isFinalStep ? finalStepText : nextStepText}
        </Button>
      </div>
    </div>
  )
}

const NewTriggerWizard = ({ finish }) => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)

  const classes = useStyles()

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  return (
    <>
      <div className={classes.modalHeader}>
        <div className={classes.rowWrapper}>
          <H2>New Compliance Trigger</H2>
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
      <div className={classes.modalBody}>
        <Wizard
          nextStepText={'Next'}
          finalStepText={'Add Trigger'}
          finish={finish}>
          <SelectTriggerDirection />
          <SelectTriggerType />
          <SelectTriggerRequirements />
        </Wizard>
      </div>
    </>
  )
}

export { NewTriggerWizard }
