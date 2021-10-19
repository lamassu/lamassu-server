import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { comet } from 'src/styling/variables'

import { entryType } from './helper'

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

const getStep = step => {
  switch (step) {
    case 1:
      return entryType
    default:
      return entryType
  }
}

const Wizard = ({ onClose, save, error }) => {
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
    <>
      <Modal
        title="Manual data entry"
        handleClose={onClose}
        width={520}
        height={520}
        open={true}>
        <Stepper
          className={classes.stepper}
          steps={LAST_STEP}
          currentStep={step}
        />
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          enableReinitialize
          onSubmit={onContinue}
          initialValues={stepOptions.initialValues}
          validationSchema={stepOptions.schema}>
          <Form className={classes.form}>
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
