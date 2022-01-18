import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState, Fragment } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { comet } from 'src/styling/variables'

import {
  entryType,
  customElements,
  requirementElements,
  formatDates,
  REQUIREMENT,
  ID_CARD_DATA
} from './helper'

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
  },
  dropdownField: {
    marginTop: 16,
    minWidth: 155
  }
}

const useStyles = makeStyles(styles)

const getStep = (step, selectedValues) => {
  const elements =
    selectedValues?.entryType === REQUIREMENT &&
    !R.isNil(selectedValues?.requirement)
      ? requirementElements[selectedValues?.requirement]
      : customElements[selectedValues?.dataType]

  switch (step) {
    case 1:
      return entryType
    case 2:
      return elements
    default:
      return Fragment
  }
}

const Wizard = ({
  onClose,
  save,
  error,
  customInfoRequirementOptions,
  addCustomerData,
  addPhoto
}) => {
  const classes = useStyles()

  const [selectedValues, setSelectedValues] = useState(null)

  const [{ step, config }, setState] = useState({
    step: 1
  })

  const isIdCardData = values => values?.requirement === ID_CARD_DATA
  const formatCustomerData = (it, newConfig) =>
    isIdCardData(newConfig) ? { [newConfig.requirement]: formatDates(it) } : it

  const isLastStep = step === LAST_STEP
  const stepOptions = getStep(step, selectedValues)

  const onContinue = async it => {
    const newConfig = R.merge(config, stepOptions.schema.cast(it))
    setSelectedValues(newConfig)

    if (isLastStep) {
      switch (stepOptions.saveType) {
        case 'customerData':
          return addCustomerData(formatCustomerData(it, newConfig))
        case 'customerDataUpload':
          return addPhoto({
            newPhoto: R.head(R.values(it)),
            photoType: R.head(R.keys(it))
          })
        case 'customEntry':
          return save(newConfig)
        case 'customInfoRequirement':
          return
        // case 'customerEntryUpload':
        //   break
        default:
          break
      }
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
            <stepOptions.Component
              selectedValues={selectedValues}
              customInfoRequirementOptions={customInfoRequirementOptions}
              {...stepOptions.props}
            />
            <div className={classes.submit}>
              {error && <ErrorMessage>Failed to save</ErrorMessage>}
              <Button className={classes.button} type="submit">
                {isLastStep ? 'Add Data' : 'Next'}
              </Button>
            </div>
          </Form>
        </Formik>
      </Modal>
    </>
  )
}

export default Wizard
