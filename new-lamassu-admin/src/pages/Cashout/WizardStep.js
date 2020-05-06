import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useReducer, useEffect } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs'
import { Info2, H4, P } from 'src/components/typography'

import styles from './WizardStep.styles'
const useStyles = makeStyles(styles)

const initialState = {
  selected: null,
  iError: false
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'select':
      return {
        form: null,
        selected: action.selected,
        isNew: null,
        iError: false
      }
    case 'form':
      return {
        form: action.form,
        selected: action.form.code,
        isNew: true,
        iError: false
      }
    case 'error':
      return R.merge(state, { iError: true })
    case 'reset':
      return initialState
    default:
      throw new Error()
  }
}

const WizardStep = ({
  type,
  name,
  step,
  error,
  lastStep,
  onContinue,
  display
}) => {
  const classes = useStyles()
  const [{ iError, selected }, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [step])

  const iContinue = config => {
    if (lastStep) config[type] = true

    if (!config || !config[type]) {
      return dispatch({ type: 'error' })
    }

    onContinue(config)
  }

  const label = lastStep ? 'Finish' : 'Next'
  const subtitleClass = {
    [classes.subtitle]: true,
    [classes.error]: iError
  }

  return (
    <>
      <Info2 className={classes.title}>{name}</Info2>
      <Stepper steps={3} currentStep={step} />
      {display && <H4 className={classnames(subtitleClass)}>Edit {display}</H4>}

      {!lastStep && (
        <TextInput
          label={'Choose bill denomination'}
          onChange={evt =>
            dispatch({ type: 'select', selected: evt.target.value })
          }
          autoFocus
          id="confirm-input"
          type="text"
          size="lg"
          touched={{}}
          error={false}
          InputLabelProps={{ shrink: true }}
        />
        // TODO: there was a disabled link here showing the currency code; restore it
      )}

      {lastStep && (
        <>
          <P>
            When enabling cash out, your bill count will be authomatically set
            to zero. Make sure you physically put cash inside the cashboxes to
            allow the machine to dispense it to your users. If you already did,
            make sure you set the correct cash out bill count for this machine
            on your Cashboxes tab under Maintenance.
          </P>
          <P>
            When enabling cash out, default commissions will be set. To change
            commissions for this machine, please go to the Commissions tab under
            Settings. where you can set exceptions for each of the available
            cryptocurrencies.
          </P>
        </>
      )}

      <div className={classes.submit}>
        {error && <ErrorMessage>Failed to save</ErrorMessage>}
        <Button
          className={classes.button}
          onClick={() => iContinue({ [type]: selected })}>
          {label}
        </Button>
      </div>
    </>
  )
}

export default WizardStep
