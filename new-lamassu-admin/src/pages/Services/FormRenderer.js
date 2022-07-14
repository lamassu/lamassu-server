import { makeStyles, Grid } from '@material-ui/core'
import { Formik, Form, FastField } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import { Button, SupportLinkButton } from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik'
import { spacer } from 'src/styling/variables'

const styles = {
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 4, 0]]
  },
  buttonWrapper: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      marginLeft: 15
    },
    '& > :first-child': {
      marginLeft: 0
    },
    margin: [['auto', 0, 0, 'auto']]
  },
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  grid: {
    marginBottom: 24,
    marginTop: 12
  },
  flexStartAlign: {
    alignSelf: 'flex-start'
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
  supportArticle,
  xs = 12
}) => {
  const classes = useStyles()

  const initialValues = R.compose(
    R.mergeAll,
    R.map(({ code }) => ({ [code]: (value && value[code]) ?? '' }))
  )(elements)

  const values = R.merge(initialValues, value)

  const [saveError, setSaveError] = useState([])

  const saveNonEmptySecret = it => {
    const emptySecretFields = R.compose(
      R.map(R.prop('code')),
      R.filter(
        elem =>
          R.prop('component', elem) === SecretInput &&
          R.isEmpty(it[R.prop('code', elem)])
      )
    )(elements)
    return save(R.omit(emptySecretFields, it)).catch(s => {
      setSaveError({ save: 'Failed to save changes' })
    })
  }

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={values}
      validationSchema={validationSchema}
      onSubmit={saveNonEmptySecret}>
      {({ errors }) => (
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
          {!R.isNil(supportArticle) && (
            <div className={classes.flexStartAlign}>
              <SupportLinkButton
                link={supportArticle}
                label="Lamassu Support Article"
                bottomSpace="2"
              />
            </div>
          )}
          <div className={classes.footer}>
            {!R.isEmpty(R.mergeRight(errors, saveError)) && (
              <ErrorMessage>
                {R.head(R.values(R.mergeRight(errors, saveError)))}
              </ErrorMessage>
            )}
            <div className={classes.buttonWrapper}>
              <Button className={buttonClass} type="submit">
                {buttonLabel}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default FormRenderer
