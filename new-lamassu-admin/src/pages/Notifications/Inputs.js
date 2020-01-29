import React from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import * as Yup from 'yup'
import { Form, Formik, Field as FormikField } from 'formik'
import { makeStyles } from '@material-ui/core'

import { H4, Label1, Info1, TL2, Info2 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { Link } from 'src/components/buttons'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import {
  inputSectionStyles,
  percentageAndNumericInputStyles,
  multiplePercentageInputStyles
} from './Notifications.styles'

const fieldStyles = {
  field: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: 53,
    padding: 0,
    '& > div': {
      display: 'flex',
      alignItems: 'baseline',
      '& > p:first-child': {
        margin: [[0, 4, 5, 0]]
      },
      '&> p:last-child': {
        margin: 0
      }
    },
    '& .MuiInputBase-input': {
      width: 80
    }
  },
  label: {
    margin: 0
  },
  notEditing: {
    '& > div': {
      margin: [[5, 0, 0, 0]],
      '& > p:first-child': {
        height: 16
      }
    }
  },
  percentageInput: {
    '& > div': {
      '& .MuiInputBase-input': {
        width: 30
      }
    }
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const Field = ({
  editing,
  field,
  displayValue,
  decoration,
  className,
  ...props
}) => {
  const classes = fieldUseStyles()

  const classNames = {
    [className]: true,
    [classes.field]: true,
    [classes.notEditing]: !editing,
    [classes.percentageInput]: decoration === '%'
  }

  return (
    <div className={classnames(classNames)}>
      {field.label && <Label1 className={classes.label}>{field.label}</Label1>}
      <div>
        {!editing && props.large && (
          <>
            <Info1>{displayValue(field.value)}</Info1>
          </>
        )}
        {!editing && !props.large && (
          <>
            <Info2>{displayValue(field.value)}</Info2>
          </>
        )}
        {editing && (
          <FormikField
            id={field.name}
            name={field.name}
            component={TextInputFormik}
            placeholder={field.placeholder}
            type="text"
            {...props}
          />
        )}
        <TL2>{decoration}</TL2>
      </div>
    </div>
  )
}

const useStyles = makeStyles(inputSectionStyles)

const BigNumericInput = ({
  title,
  field,
  editing,
  disabled,
  setEditing,
  handleSubmit
}) => {
  const classes = useStyles()

  const { name, value } = field

  return (
    <Formik
      initialValues={{ [name]: value }}
      onSubmit={values => {
        handleSubmit(R.values(values)[0])
      }}
      onReset={(values, bag) => {
        setEditing(false)
      }}>
      <Form>
        <div className={classes.header}>
          <H4>{title}</H4>
          {!editing && !disabled && (
            <button onClick={() => setEditing(true)}>
              <EditIcon />
            </button>
          )}
          {disabled && (
            <div>
              <DisabledEditIcon />
            </div>
          )}
          {editing && (
            <>
              <Link color="primary" type="submit">
                Save
              </Link>
              <Link color="secondary" type="reset">
                Cancel
              </Link>
            </>
          )}
        </div>
        <div className={classes.body}>
          <Field
            editing={editing}
            field={field}
            displayValue={x => (x === '' ? '-' : x)}
            decoration="EUR"
            large
          />
        </div>
      </Form>
    </Formik>
  )
}

const percentageAndNumericInputUseStyles = makeStyles(
  R.merge(inputSectionStyles, percentageAndNumericInputStyles)
)

const BigPercentageAndNumericInput = ({
  title,
  fields,
  editing,
  disabled,
  setEditing,
  handleSubmit
}) => {
  const classes = percentageAndNumericInputUseStyles()

  const { percentage, numeric } = fields
  const { name: percentageName, value: percentageValue } = percentage
  const { name: numericName, value: numericValue } = numeric

  return (
    <Formik
      initialValues={{
        [percentageName]: percentageValue,
        [numericName]: numericValue
      }}
      validationSchema={Yup.object().shape({
        [percentageName]: Yup.string().required('Fill in both fields.'),
        [numericName]: Yup.string().required('Fill in both fields.')
      })}
      onSubmit={values => {
        handleSubmit(values)
      }}
      onReset={(values, bag) => {
        setEditing(false)
      }}>
      <Form>
        <div className={classes.header}>
          <H4>{title}</H4>
          {!editing && !disabled && (
            <button onClick={() => setEditing(true)}>
              <EditIcon />
            </button>
          )}
          {disabled && (
            <div>
              <DisabledEditIcon />
            </div>
          )}
          {editing && (
            <>
              <Link color="primary" type="submit">
                Save
              </Link>
              <Link color="secondary" type="reset">
                Cancel
              </Link>
            </>
          )}
        </div>
        <div className={classes.body}>
          <div className={classes.percentageDisplay}>
            <div style={{ height: `${percentageValue}%` }}></div>
          </div>
          <div className={classes.inputColumn}>
            <Field
              editing={editing}
              field={percentage}
              displayValue={x => (x === '' ? '-' : x)}
              decoration="%"
              large
            />
            <Field
              editing={editing}
              field={numeric}
              displayValue={x => (x === '' ? '-' : x)}
              decoration="EUR"
              large
            />
          </div>
        </div>
      </Form>
    </Formik>
  )
}

const multiplePercentageInputUseStyles = makeStyles(
  R.merge(inputSectionStyles, multiplePercentageInputStyles)
)

const MultiplePercentageInput = ({
  title,
  fields,
  editing,
  disabled,
  setEditing,
  handleSubmit
}) => {
  const classes = multiplePercentageInputUseStyles()

  const initialValues = R.fromPairs(R.map(f => [f.name, f.value], fields))

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={values => {
        handleSubmit(values)
      }}
      onReset={(values, bag) => {
        setEditing(false)
      }}>
      <Form>
        <div className={classes.header}>
          <H4>{title}</H4>
          {!editing && !disabled && (
            <button onClick={() => setEditing(true)}>
              <EditIcon />
            </button>
          )}
          {disabled && (
            <div>
              <DisabledEditIcon />
            </div>
          )}
          {editing && (
            <>
              <Link color="primary" type="submit">
                Save
              </Link>
              <Link color="secondary" type="reset">
                Cancel
              </Link>
            </>
          )}
        </div>
        <div className={classes.body}>
          {fields.map((field, idx) => (
            <div key={idx}>
              <div className={classes.percentageDisplay}>
                <div style={{ height: `${field.value}%` }}></div>
              </div>
              <div className={classes.inputColumn}>
                <TL2 className={classes.title}>{field.title}</TL2>
                <Field
                  editing={editing}
                  field={field}
                  displayValue={x => (x === '' ? '-' : x)}
                  decoration="%"
                  className={classes.percentageInput}
                  large
                />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </Formik>
  )
}

export {
  Field,
  BigNumericInput,
  BigPercentageAndNumericInput,
  MultiplePercentageInput
}
