import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'

import ChooseType, {
  validationSchema as chooseTypeSchema,
  defaultValues as chooseTypeDefaults
} from './Forms/ChooseType'
import NameOfRequirement, {
  validationSchema as nameOfReqSchema,
  defaultValues as nameOfReqDefaults
} from './Forms/NameOfRequirement'
import Screen1Information, {
  validationSchema as screen1InfoSchema,
  defaultValues as screen1InfoDefaults
} from './Forms/Screen1Information'
import Screen2Information, {
  validationSchema as screen2InfoSchema,
  defaultValues as screen2InfoDefaults
} from './Forms/Screen2Information'
import TypeFields, {
  defaultValues as typeFieldsDefaults,
  validationSchema as typeFieldsValidationSchema
} from './Forms/TypeFields'
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
  }
}

const useStyles = makeStyles(styles)

const getStep = step => {
  switch (step) {
    case 1:
      return {
        schema: nameOfReqSchema,
        Component: NameOfRequirement
      }
    case 2:
      return {
        schema: screen1InfoSchema,
        Component: Screen1Information
      }
    case 3:
      return { schema: chooseTypeSchema, Component: ChooseType }
    case 4:
      return {
        schema: screen2InfoSchema,
        Component: Screen2Information
      }
    case 5:
      return {
        schema: typeFieldsValidationSchema,
        Component: TypeFields
      }
    default:
      return {
        schema: {},
        Component: () => {
          return <h1>Default component step</h1>
        }
      }
  }
}

const nonEmptyStr = obj => obj.text && obj.text.length

const formatValues = (values, isEditing) => {
  const isChoiceList = values.inputType === 'choiceList'
  const choices = isChoiceList
    ? isEditing
      ? R.path(['listChoices'])(values)
      : R.map(o => o.text)(R.filter(nonEmptyStr)(values.listChoices) ?? [])
    : []

  const hasInputLength = values.constraintType === 'length'
  const inputLength = hasInputLength ? values.inputLength : ''

  let resObj = {
    name: values.requirementName,
    screen1: {
      text: values.screen1Text,
      title: values.screen1Title
    },
    screen2: {
      title: values.screen2Title,
      text: values.screen2Text
    },
    input: {
      type: values.inputType,
      constraintType: values.constraintType
    }
  }

  if (isChoiceList) {
    resObj = R.assocPath(['input', 'choiceList'], choices, resObj)
  }

  if (hasInputLength) {
    resObj = R.assocPath(['input', 'numDigits'], inputLength, resObj)
  }

  if (values.inputLabel1) {
    resObj = R.assocPath(['input', 'label1'], values.inputLabel1, resObj)
  }

  if (values.inputLabel2) {
    resObj = R.assocPath(['input', 'label2'], values.inputLabel2, resObj)
  }

  if (isEditing) {
    resObj = R.assocPath(['id'], values.id, resObj)
  }

  return resObj
}

const makeEditingValues = it => {
  const { customRequest } = it
  return {
    id: it.id,
    requirementName: customRequest.name,
    screen1Title: customRequest.screen1.title,
    screen1Text: customRequest.screen1.text,
    screen2Title: customRequest.screen2.title,
    screen2Text: customRequest.screen2.text,
    inputType: customRequest.input.type,
    inputLabel1: customRequest.input.label1,
    inputLabel2: customRequest.input.label2,
    listChoices: customRequest.input.choiceList,
    constraintType: customRequest.input.constraintType,
    inputLength: customRequest.input.numDigits
  }
}

const chooseNotNull = (a, b) => {
  if (!R.isNil(b)) return b
  return a
}

const Wizard = ({ onClose, error = false, toBeEdited, onSave }) => {
  const classes = useStyles()
  const isEditing = !R.isNil(toBeEdited)
  const [step, setStep] = useState(isEditing ? 1 : 0)
  const stepOptions = getStep(step)
  const isLastStep = step === LAST_STEP

  const onContinue = (values, actions) => {
    const showScreen2 =
      values.inputType === 'numerical' || values.inputType === 'choiceList'
    if (isEditing && step === 2) {
      return showScreen2
        ? setStep(4)
        : onSave(formatValues(values, isEditing), isEditing)
    }
    if (isEditing && step === 4) {
      return onSave(formatValues(values, isEditing), isEditing)
    }
    if (step === 3) {
      return showScreen2 ? setStep(step + 1) : setStep(step + 2)
    }
    if (!isLastStep) {
      return setStep(step + 1)
    }
    return onSave(formatValues(values, isEditing), isEditing)
  }

  const editingValues = isEditing ? makeEditingValues(toBeEdited) : {}
  const wizardTitle = isEditing
    ? 'Editing custom requirement'
    : 'New custom requirement'
  return (
    <Modal
      title={step > 0 ? wizardTitle : ''}
      handleClose={onClose}
      width={520}
      height={620}
      open={true}>
      {step > 0 && (
        <Stepper
          className={classes.stepper}
          steps={LAST_STEP}
          currentStep={step}
        />
      )}
      {step === 0 && !isEditing && <WizardSplash onContinue={onContinue} />}
      {step > 0 && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          enableReinitialize={true}
          onSubmit={onContinue}
          initialValues={R.mergeWith(
            chooseNotNull,
            {
              ...nameOfReqDefaults,
              ...screen1InfoDefaults,
              ...screen2InfoDefaults,
              ...chooseTypeDefaults,
              ...typeFieldsDefaults
            },
            editingValues
          )}
          validationSchema={stepOptions.schema}>
          <Form className={classes.form} id={'custom-requirement-form'}>
            <stepOptions.Component />
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
  )
}

export default Wizard
