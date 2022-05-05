import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React from 'react'

import RadioGroup from 'src/components/inputs/formik/RadioGroup'
import TextInput from 'src/components/inputs/formik/TextInput'
import { H4 } from 'src/components/typography'

import styles from './formStyles.styles'
const useStyles = makeStyles(styles)

const options = [
  { display: 'None', code: 'none' },
  { display: 'Email', code: 'email' },
  {
    display: 'Space separation',
    subtitle: '(e.g. first and last name)',
    code: 'spaceSeparation'
  }
]

const TextEntry = () => {
  const classes = useStyles()
  const context = useFormikContext()
  const showErrorColor = {
    [classes.radioSubtitle]: true,
    [classes.error]:
      !R.path(['values', 'constraintType'])(context) &&
      R.path(['errors', 'constraintType'])(context)
  }

  const getLabelInputs = () => {
    switch (context.values.constraintType) {
      case 'spaceSeparation':
        return (
          <div className={classes.flex}>
            <Field
              className={classes.label}
              component={TextInput}
              name={'inputLabel1'}
              label={'First word label'}
            />
            <Field
              className={classes.label}
              component={TextInput}
              name={'inputLabel2'}
              label={'Second word label'}
            />
          </div>
        )
      default:
        return (
          <Field
            className={classes.label}
            component={TextInput}
            name={'inputLabel1'}
            label={'Text entry label'}
          />
        )
    }
  }

  return (
    <>
      <H4 className={classnames(showErrorColor)}>Text entry constraints</H4>
      <Field
        className={classes.row}
        component={RadioGroup}
        options={options}
        name="constraintType"
      />
      {getLabelInputs()}
    </>
  )
}

export default TextEntry
