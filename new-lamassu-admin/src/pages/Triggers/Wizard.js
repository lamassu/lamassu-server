import { makeStyles } from '@material-ui/core'
import { Form, Formik, useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useState, Fragment, useEffect } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { H5, Info3 } from 'src/components/typography'
import { comet } from 'src/styling/variables'

import { type, requirements } from './helper'

const LAST_STEP = 2

const styles = {
  stepper: {
    margin: [[16, 0, 14, 0]]
  },
  submit: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, 24]]
  },
  button: {
    marginLeft: 'auto'
  },
  form: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  infoTitle: {
    margin: [[18, 0, 20, 0]]
  },
  infoCurrentText: {
    color: comet
  },
  blankSpace: {
    padding: [[0, 30]],
    margin: [[0, 4, 0, 2]],
    borderBottom: `1px solid ${comet}`,
    display: 'inline-block'
  }
}

const useStyles = makeStyles(styles)

const getStep = (step, currency) => {
  switch (step) {
    // case 1:
    //   return txDirection
    case 1:
      return type(currency)
    case 2:
      return requirements
    default:
      return Fragment
  }
}

const getText = (step, config, currency) => {
  switch (step) {
    // case 1:
    //   return `In ${getDirectionText(config)} transactions`
    case 1:
      return `If the user ${getTypeText(config, currency)}`
    case 2:
      return `the user will be ${getRequirementText(config)}.`
    default:
      return ''
  }
}

const orUnderline = value => {
  return R.isEmpty(value) || R.isNil(value) ? '⎼⎼⎼⎼⎼ ' : value
}

// const getDirectionText = config => {
//   switch (config.direction) {
//     case 'both':
//       return 'both cash-in and cash-out'
//     case 'cashIn':
//       return 'cash-in'
//     case 'cashOut':
//       return 'cash-out'
//     default:
//       return orUnderline(null)
//   }
// }

const getTypeText = (config, currency) => {
  switch (config.triggerType) {
    case 'txAmount':
      return `makes a single transaction over ${orUnderline(
        config.threshold.threshold
      )} ${currency}`
    case 'txVolume':
      return `makes ${orUnderline(
        config.threshold.threshold
      )} ${currency} worth of transactions within ${orUnderline(
        config.threshold.thresholdDays
      )} days`
    case 'txVelocity':
      return `makes ${orUnderline(
        config.threshold.threshold
      )} transactions in ${orUnderline(config.threshold.thresholdDays)} days`
    case 'consecutiveDays':
      return `at least one transaction every day for ${orUnderline(
        config.threshold.thresholdDays
      )} days`
    default:
      return ''
  }
}

const getRequirementText = config => {
  switch (config.requirement?.requirement) {
    case 'sms':
      return 'asked to enter code provided through SMS verification'
    case 'idCardPhoto':
      return 'asked to scan a ID with photo'
    case 'idCardData':
      return 'asked to scan a ID'
    case 'facephoto':
      return 'asked to have a photo taken'
    case 'usSsn':
      return 'asked to input his social security number'
    case 'sanctions':
      return 'matched against the OFAC sanctions list'
    case 'superuser':
      return ''
    case 'suspend':
      return `suspended for ${orUnderline(
        config.requirement.suspensionDays
      )} days`
    case 'block':
      return 'blocked'
    default:
      return orUnderline(null)
  }
}

const InfoPanel = ({ step, config = {}, liveValues = {}, currency }) => {
  const classes = useStyles()

  const oldText = R.range(1, step)
    .map(it => getText(it, config, currency))
    .join(', ')
  const newText = getText(step, liveValues, currency)
  const isLastStep = step === LAST_STEP

  const newTextParts = newText.split('⎼⎼⎼⎼⎼ ')
  const mapIndexed = R.addIndex(R.map)
  const newTextElements = mapIndexed((it, idx) => {
    return idx === newTextParts.length - 1 ? (
      <span className={classes.infoCurrentText}>{it}</span>
    ) : (
      <>
        <span className={classes.infoCurrentText}>{it}</span>
        <span className={classes.blankSpace}></span>
      </>
    )
  })(newTextParts)

  return (
    <>
      <H5 className={classes.infoTitle}>Trigger overview so far</H5>
      <Info3 noMargin className={classes.infoText}>
        {oldText}
        {step !== 1 && ', '}
        {newTextElements}
        {/* <span className={classes.infoCurrentText}>{newText}</span> */}
        {!isLastStep && '...'}
      </Info3>
    </>
  )
}

const GetValues = ({ setValues }) => {
  const { values } = useFormikContext()
  useEffect(() => {
    setValues && values && setValues(values)
  }, [setValues, values])

  return null
}

const Wizard = ({ onClose, save, error, currency }) => {
  const classes = useStyles()

  const [liveValues, setLiveValues] = useState({})
  const [{ step, config }, setState] = useState({
    step: 1
  })

  const isLastStep = step === LAST_STEP
  const stepOptions = getStep(step, currency)

  const onContinue = async it => {
    const newConfig = R.merge(config, stepOptions.schema.cast(it))

    if (isLastStep) {
      return save(newConfig)
    }

    setState({
      step: step + 1,
      config: newConfig
    })
  }

  return (
    <>
      <Modal
        title="New compliance trigger"
        handleClose={onClose}
        width={520}
        height={520}
        infoPanel={
          <InfoPanel
            currency={currency}
            step={step}
            config={config}
            liveValues={liveValues}
          />
        }
        infoPanelHeight={172}
        open={true}>
        <Stepper
          className={classes.stepper}
          steps={LAST_STEP}
          currentStep={step}
        />
        <Formik
          enableReinitialize
          onSubmit={onContinue}
          initialValues={stepOptions.initialValues}
          validationSchema={stepOptions.schema}>
          <Form className={classes.form}>
            <GetValues setValues={setLiveValues} />
            <stepOptions.Component {...stepOptions.props} />
            <div className={classes.submit}>
              {error && <ErrorMessage>Failed to save</ErrorMessage>}
              <Button className={classes.button} type="submit">
                {isLastStep ? 'Finish' : 'Next'}
              </Button>
            </div>
          </Form>
        </Formik>
      </Modal>
    </>
  )
}

export default Wizard
