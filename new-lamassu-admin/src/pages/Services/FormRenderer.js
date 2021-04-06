import { makeStyles, Grid } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, FastField } from 'formik'
import * as R from 'ramda'
import React from 'react'

import { Button } from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik'

const styles = {
  button: {
    margin: [['auto', 0, 32, 'auto']]
  },
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  grid: {
    marginBottom: 24,
    marginTop: 12
  }
}

const useStyles = makeStyles(styles)
const FormRenderer = ({
  validationSchema,
  elements,
  value,
  save,
  buttonLabel = 'Save changes',
  buttonClass,
  xs = 12
}) => {
  const classes = useStyles()

  const initialValues = R.compose(
    R.mergeAll,
    R.map(({ code }) => ({ [code]: (value && value[code]) ?? '' }))
  )(elements)

  const values = R.merge(initialValues, value)

  const saveNonEmptySecret = it => {
    const emptySecretFields = R.compose(
      R.map(R.prop('code')),
      R.filter(
        elem =>
          R.prop('component', elem) === SecretInput &&
          R.isEmpty(it[R.prop('code', elem)])
      )
    )(elements)
    return save(R.omit(emptySecretFields, it))
  }

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={values}
      validationSchema={validationSchema}
      onSubmit={saveNonEmptySecret}>
      <Form className={classes.form}>
        <Grid container spacing={3} className={classes.grid}>
          {elements.map(
            ({ component, code, display, settings, inputProps }) => (
              <Grid item xs={xs} key={code}>
                <FastField
                  component={component}
                  {...inputProps}
                  name={code}
                  label={display}
                  settings={settings}
                  fullWidth={true}
                />
              </Grid>
            )
          )}
        </Grid>
        <Button
          className={classnames(classes.button, buttonClass)}
          type="submit">
          {buttonLabel}
        </Button>
      </Form>
    </Formik>
  )
}

export default FormRenderer
