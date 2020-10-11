import { makeStyles, Grid } from '@material-ui/core'
import classnames from 'classnames'
import { Formik, Form, FastField } from 'formik'
import * as R from 'ramda'
import React from 'react'

import { Button } from 'src/components/buttons'

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

  return (
    <Formik
      enableReinitialize
      initialValues={values}
      validationSchema={validationSchema}
      onSubmit={save}>
      <Form className={classes.form}>
        <Grid container spacing={3} className={classes.grid}>
          {elements.map(({ component, code, display, inputProps }) => (
            <Grid item xs={xs} key={code}>
              <FastField
                component={component}
                {...inputProps}
                name={code}
                label={display}
                fullWidth={true}
              />
            </Grid>
          ))}
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
