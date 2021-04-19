/* eslint-disable */
import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { comet } from 'src/styling/variables'

import NameOfRequirement, {
  validationSchema as nameOfReqSchema,
  defaultValues as nameOfReqDefaults
} from './Forms/NameOfRequirement'
import ScreenInformation, {
  validationSchema as screenInfoSchema,
  defaultValues as screenInfoDefaults
} from './Forms/ScreenInformation'
import WizardSplash from './WizardSplash'

const LAST_STEP = 5

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
const getStep = step => {
  switch (step) {
    case 1:
      return {
        initialValues: nameOfReqDefaults,
        schema: nameOfReqSchema,
        Component: NameOfRequirement
      }
    case 2:
      return {
        initialValues: screenInfoDefaults,
        schema: screenInfoSchema,
        Component: ScreenInformation
      }
    default:
      return {
        initialValues: {},
        schema: {},
        Component: () => {
          return <h1>Component step default</h1>
        }
      }
  }
}

const Wizard = ({ onClose, error = false }) => {
  const classes = useStyles()
  const [step, setStep] = useState(0)
  const onContinue = (values, actions) => {
    /*     step > 0 && console.log(values) */
    setStep(step + 1)
  }
  const stepOptions = getStep(step)
  const isLastStep = step === LAST_STEP
  return (
    <>
      <Modal
        title={step > 0 ? 'New custom requirement' : ''}
        handleClose={onClose}
        width={520}
        height={580}
        open={true}>
        {step > 0 && (
          <Stepper
            className={classes.stepper}
            steps={LAST_STEP}
            currentStep={step}
          />
        )}
        {step === 0 && <WizardSplash onContinue={onContinue} />}
        {step > 0 && (
          <Formik
            validateOnBlur={false}
            validateOnChange={false}
            enableReinitialize
            onSubmit={onContinue}
            initialValues={stepOptions.initialValues}
            validationSchema={stepOptions.schema}>
            <Form className={classes.form} id={'custom-requirement-form'}>
              <stepOptions.Component {...stepOptions.props} />
              <div className={classes.submit}>
                {error && <ErrorMessage>Failed to save</ErrorMessage>}
                <Button className={classes.button} type="submit">
                  {isLastStep ? 'Save' : 'Next'}
                </Button>
              </div>
            </Form>
          </Formik>
        )}
      </Modal>
    </>
  )
}

export default Wizard
