import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import React, { useReducer, useEffect } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Stepper from 'src/components/Stepper'
import { Button } from 'src/components/buttons'
import { RadioGroup, Autocomplete } from 'src/components/inputs'
import { NumberInput } from 'src/components/inputs/formik'
import { H4, Info2 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import { startCase } from 'src/utils/string'

import styles from './WizardStep.styles'

const useStyles = makeStyles(styles)

const initialState = {
  form: null,
  selected: null,
  isNew: false,
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
    case 'new':
      return { form: state.form, selected: null, isNew: true, iError: false }
    case 'form':
      return {
        form: action.form,
        selected: action.form.code,
        isNew: true,
        iError: false
      }
    case 'error':
      return R.merge(state, { innerError: true })
    case 'reset':
      return initialState
    default:
      throw new Error()
  }
}

const WizardStep = ({
  type,
  schema: stepSchema,
  coin,
  name,
  step,
  error,
  lastStep,
  onContinue,
  fiatCurrency,
  filled,
  unfilled,
  getValue
}) => {
  const classes = useStyles()
  const [{ innerError, selected, form, isNew }, dispatch] = useReducer(
    reducer,
    initialState
  )

  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [step])

  const innerContinue = (config, account) => {
    if (!config || !config[type]) {
      return dispatch({ type: 'error' })
    }
    onContinue(config, account)
  }

  const label = lastStep ? 'Finish' : 'Next'
  const displayName = name ?? type
  const subtitleClass = {
    [classes.subtitle]: true,
    [classes.error]: innerError
  }
  return (
    <>
      <Info2 className={classes.title}>{startCase(displayName)}</Info2>
      <Stepper steps={5} currentStep={step} />
      <H4 className={classnames(subtitleClass)}>
        {step < 4
          ? `Select a ${displayName} or set up a new one`
          : `Select ${displayName} for ${coin}`}
      </H4>
      {step !== 5 && (
        <RadioGroup
          options={filled}
          value={selected}
          className={classes.radioGroup}
          onChange={(evt, it) => {
            dispatch({ type: 'select', selected: it })
          }}
          labelClassName={classes.radioLabel}
          radioClassName={classes.radio}
        />
      )}
      {step === 5 && (
        <Formik
          validateOnBlur={false}
          validateOnChange={true}
          initialValues={{ zeroConfLimit: '' }}
          enableReinitialize
          validationSchema={stepSchema}>
          {({ values, setFieldValue }) => (
            <Form>
              <div
                className={classnames(
                  classes.horizontalAlign,
                  classes.lineAlignment
                )}>
                <Field
                  component={NumberInput}
                  decimalPlaces={0}
                  width={50}
                  placeholder={'0'}
                  name={`zeroConfLimit`}
                  onChange={event => {
                    dispatch({
                      type: 'select',
                      selected: event.target.value
                    })
                    setFieldValue(event.target.id, event.target.value)
                  }}
                  className={classes.zeroConfLimit}
                />
                <Info2>{fiatCurrency}</Info2>
              </div>
            </Form>
          )}
        </Formik>
      )}
      <div className={classes.setupNew}>
        {!R.isEmpty(unfilled) && !R.isNil(unfilled) && (
          <RadioGroup
            value={isNew}
            onChange={(evt, it) => {
              dispatch({ type: 'new' })
            }}
            labelClassName={classes.radioLabel}
            radioClassName={classes.radio}
            options={[{ display: 'Set up new', code: true }]}
          />
        )}
        {isNew && (
          <Autocomplete
            fullWidth
            label={`Select ${displayName}`}
            className={classes.picker}
            getOptionSelected={R.eqProps('code')}
            labelProp={'display'}
            options={unfilled}
            onChange={(evt, it) => {
              dispatch({ type: 'form', form: it })
            }}
          />
        )}
      </div>
      {form && (
        <FormRenderer
          save={it => innerContinue({ [type]: form.code }, { [form.code]: it })}
          elements={schema[form.code].elements}
          validationSchema={schema[form.code].validationSchema}
          value={getValue(form.code)}
          buttonLabel={label}
        />
      )}
      {!form && (
        <div className={classes.submit}>
          {error && <ErrorMessage>Failed to save</ErrorMessage>}
          <Button
            className={classes.button}
            onClick={() => innerContinue({ [type]: selected })}>
            {label}
          </Button>
        </div>
      )}
    </>
  )
}

export default WizardStep
