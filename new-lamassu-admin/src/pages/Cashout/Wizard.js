import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'

import { H1, Info2, H4, P } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import Stage from 'src/components/Stage'
import { TextInput } from 'src/components/inputs'
import ErrorMessage from 'src/components/ErrorMessage'
import { spacer } from 'src/styling/variables'

const styles = {
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: [[24, 32, 0]],
    '& > h1': {
      margin: [[0, 0, 10]]
    },
    '& > h4': {
      margin: [[32, 0, 32 - 9, 0]]
    },
    '& > p': {
      margin: 0
    }
  },
  submitButtonWrapper: {
    display: 'flex',
    alignSelf: 'flex-end',
    margin: [['auto', 0, 0]]
  },
  submitButton: {
    width: 67,
    padding: [[0, 0]],
    margin: [['auto', 0, 24, 20]],
    '&:active': {
      margin: [['auto', 0, 24, 20]]
    }
  },
  stages: {
    marginTop: 10
  },
  texInput: {
    width: spacer * 6,
    marginRight: spacer * 2
  }
}

const useStyles = makeStyles(styles)

const SubmitButton = ({ error, label, ...props }) => {
  const classes = useStyles()

  return (
    <div className={classes.submitButtonWrapper}>
      {error && <ErrorMessage>Failed to save</ErrorMessage>}
      <Button {...props}>{label}</Button>
    </div>
  )
}

const Wizard = ({ pageName, currentStage, handleModalNavigation, machine }) => {
  const [topOverride, setTopOverride] = useState(
    machine?.cashOutDenominations?.top
  )
  const [bottomOverride, setBottomOverride] = useState(
    machine?.cashOutDenominations?.bottom
  )

  const overrideTop = event => {
    setTopOverride(Number(event.target.value))
  }

  const overrideBottom = event => {
    setBottomOverride(Number(event.target.value))
  }

  const [error, setError] = useState(null)
  const classes = useStyles()

  const handleNext = machine => event => {
    const cashOutDenominations = { top: topOverride, bottom: bottomOverride }
    const nav = handleModalNavigation({ ...machine, cashOutDenominations })(
      currentStage + 1
    )
    nav.catch(error => setError(error))
  }

  const isSubmittable = currentStage => {
    switch (currentStage) {
      case 1:
        return topOverride > 0
      case 2:
        return bottomOverride > 0
      default:
        return isSubmittable(1) && isSubmittable(2)
    }
  }

  return (
    <div className={classes.modalContent}>
      <H1>Enable cash-out</H1>
      <Info2>{machine.name}</Info2>
      <Stage
        stages={3}
        currentStage={currentStage}
        color="spring"
        className={classes.stages}
      />
      {currentStage < 3 && (
        <>
          <H4>{pageName}</H4>
          <P>Choose bill denomination</P>
        </>
      )}
      <div>
        {currentStage < 3 && (
          <>
            {currentStage === 1 && (
              <TextInput
                autoFocus
                id="confirm-input"
                type="text"
                large
                value={topOverride}
                touched={{}}
                error={false}
                InputLabelProps={{ shrink: true }}
                onChange={overrideTop}
                className={classes.texInput}
              />
            )}

            {currentStage === 2 && (
              <TextInput
                autoFocus
                id="confirm-input"
                type="text"
                large
                value={bottomOverride}
                touched={{}}
                error={false}
                InputLabelProps={{ shrink: true }}
                onChange={overrideBottom}
                className={classes.texInput}
              />
            )}

            <TextInput
              disabled
              autoFocus
              id="confirm-input"
              type="text"
              large
              value={machine.currency.code}
              touched={{}}
              InputLabelProps={{ shrink: true }}
              className={classes.texInput}
            />
          </>
        )}
        {currentStage === 3 && (
          <>
            <H4>{pageName}</H4>
            <P>
              When enabling cash out, your bill count will be authomatically set
              to zero. Make sure you physically put cash inside the cashboxes to
              allow the machine to dispense it to your users. If you already
              did, make sure you set the correct cash out bill count for this
              machine on your Cashboxes tab under Maintenance.
            </P>
            <H4>{pageName}</H4>
            <P>
              When enabling cash out, default commissions will be set. To change
              commissions for this machine, please go to the Commissions tab
              under Settings. where you can set exceptions for each of the
              available cryptocurrencies.
            </P>
          </>
        )}
      </div>
      <SubmitButton
        className={classes.submitButton}
        label={currentStage === 3 ? 'Finish' : 'Next'}
        disabled={!isSubmittable(currentStage)}
        onClick={handleNext(machine)}
        error={error}
      />
    </div>
  )
}

export default Wizard
