import React from 'react'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import { makeStyles } from '@material-ui/core'

import { H4, Label1, Info1, TL2 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { Link } from 'src/components/buttons'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { inputSectionStyles } from './Notifications.styles'

const fieldStyles = {
  field: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: 280,
    height: 77,
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
  notEditing: {
    '& > div': {
      margin: [[5, 0, 0, 0]],
      '& > p:first-child': {
        height: 16
      }
    }
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const Field = ({ editing, field, displayValue, decoration, ...props }) => {
  const classes = fieldUseStyles()

  console.log('field', field)

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing
  }

  return (
    <div className={classnames(classNames)}>
      <Label1>{field.label}</Label1>
      <div>
        {!editing && (
          <>
            <Info1>{displayValue(field.value)}</Info1>
          </>
        )}
        {editing && (
          <FormikField
            id={field.name}
            name={field.name}
            component={TextInputFormik}
            placeholder={field.placeholder}
            type="text"
            large
            {...props}
          />
        )}
        <TL2>{decoration}</TL2>
      </div>
    </div>
  )
}

const useStyles = makeStyles(inputSectionStyles)

const field = [
  {
    name: 'alert',
    label: 'Alert me over',
    value: '5000'
  }
]

const NumericInput = ({ editing, disabled }) => {
  const classes = useStyles()

  return (
    <Formik initialValues={{ alert: field[0].value }}>
      <Form>
        <div className={classes.header}>
          <H4>High value transaction</H4>
          {!editing && !disabled && (
            <button>
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
            field={field[0]}
            displayValue={x => x}
            decoration="EUR"
          />
        </div>
      </Form>
    </Formik>
  )
}

export { NumericInput }
