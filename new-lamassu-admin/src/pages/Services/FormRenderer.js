import { makeStyles, Grid } from '@material-ui/core'
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
  buttonLabel = 'Save changes'
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
          {elements.map(({ component, code, display }) => (
            <Grid item xs={12} key={code}>
              <FastField
                component={component}
                name={code}
                label={display}
                fullWidth={true}
              />
            </Grid>
          ))}
        </Grid>
        <Button className={classes.button} type="submit">
          {buttonLabel}
        </Button>
      </Form>
    </Formik>
  )
}

export default FormRenderer
