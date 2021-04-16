import { makeStyles } from '@material-ui/core'
import { Form, Formik, useFormikContext } from 'formik'
import React, { useState, useEffect } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { comet } from 'src/styling/variables'

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
  return {
    initialValues: {},
    schema: {},
    Component: () => {
      return <h1>Component</h1>
    }
  }
}

const GetValues = ({ setValues }) => {
  const { values } = useFormikContext()
  useEffect(() => {
    setValues && values && setValues(values)
  }, [setValues, values])

  return null
}

const Wizard = ({ onClose, error = false }) => {
  const classes = useStyles()
  const [liveValues, setLiveValues] = useState({})
  const [step, setStep] = useState(0)
  const onContinue = () => {
    setStep(step + 1)
  }
  const stepOptions = getStep(step)
  const isLastStep = step === LAST_STEP
  console.log(liveValues)
  return (
    <>
      <Modal
        title={step > 0 ? 'New custom info request' : ''}
        handleClose={onClose}
        width={520}
        height={520}
        infoPanelHeight={172}
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
            initialValues={stepOptions.initialValues}>
            <Form className={classes.form}>
              <GetValues setValues={setLiveValues} />
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
