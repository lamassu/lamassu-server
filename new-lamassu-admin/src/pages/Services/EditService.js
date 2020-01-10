import React, { useState } from 'react'
import { Form, Formik, Field } from 'formik'
import classnames from 'classnames'
import { makeStyles, Paper } from '@material-ui/core'

import { H2, Info3 } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as ErrorIcon } from 'src/styling/icons/warning-icon/tomato.svg'

import { editServiceStyles as styles } from './Services.styles'

const useStyles = makeStyles(styles)

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please contact support.'

const EditService = ({
  title,
  code,
  formik,
  fields,
  handleClose,
  save,
  ...props
}) => {
  const [error, setError] = useState(props.error)

  const classes = useStyles()

  const submitWrapperClasses = {
    [classes.submitWrapper]: true,
    [classes.submitError]: error
  }

  return (
    <Paper className={classes.paper}>
      <button onClick={() => handleClose()}>
        <CloseIcon />
      </button>
      <div className={classes.modalHeader}>
        <H2>{`Edit ${title}`}</H2>
      </div>
      <div className={classes.modalBody}>
        <Formik
          initialValues={formik.initialValues}
          validate={formik.validate}
          validationSchema={formik.validationSchema}
          onSubmit={values => {
            save(code, values)
              .then(m => handleClose())
              .catch(err => {
                if (err) setError(true)
              })
          }}>
          <Form>
            <div className={classes.formBody}>
              {fields &&
                fields.map((field, idx) => (
                  <div key={idx} className={classes.field}>
                    <Field
                      id={field.name}
                      name={field.name}
                      component={field.component}
                      placeholder={field.placeholder}
                      type={field.type}
                      label={field.label}
                      onFocus={() => {
                        setError(null)
                      }}
                    />
                  </div>
                ))}
            </div>
            <div className={classnames(submitWrapperClasses)}>
              <div className={classes.messageWrapper}>
                {error && (
                  <div>
                    <ErrorIcon />
                    <Info3 className={classes.message}>
                      {DEFAULT_ERROR_MESSAGE}
                    </Info3>
                  </div>
                )}
                <Button type="submit">Save changes</Button>
              </div>
            </div>
          </Form>
        </Formik>
      </div>
    </Paper>
  )
}

export default EditService
