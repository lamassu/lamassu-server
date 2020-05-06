import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState, Fragment } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'

import { direction, type, requirements } from './helper'

const LAST_STEP = 3

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
  }
}

const useStyles = makeStyles(styles)

const getStep = step => {
  switch (step) {
    case 1:
      return direction
    case 2:
      return type
    case 3:
      return requirements
    default:
      return Fragment
  }
}

const Wizard = ({ machine, onClose, save, error }) => {
  const classes = useStyles()

  const [{ step, config }, setState] = useState({
    step: 1
  })

  const isLastStep = step === LAST_STEP
  const stepOptions = getStep(step)

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
    <Modal
      title="New compliance trigger"
      handleClose={onClose}
      width={520}
      height={480}
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
          <stepOptions.Component />
          <div className={classes.submit}>
            {error && <ErrorMessage>Failed to save</ErrorMessage>}
            <Button className={classes.button} type="submit">
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </Form>
      </Formik>
    </Modal>
  )
}

export default Wizard
