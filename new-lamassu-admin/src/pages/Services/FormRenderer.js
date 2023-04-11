import { makeStyles, Grid } from '@material-ui/core'
import { Formik, Form, FastField, FieldArray } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import {
  AddButton,
  Button,
  DeleteButton,
  SupportLinkButton
} from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik'
import { Label1 } from 'src/components/typography'
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
  },
  arrayList: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginBottom: 15
    },
    '& > :last-child': {
      marginBottom: 0
    }
  },
  arrayItem: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      marginLeft: 15
    },
    '& > :first-child': {
      marginLeft: 0
    }
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
  xs = 12,
  SplashScreenComponent
}) => {
  const classes = useStyles()
  const [showSplashScreen, setShowSplashScreen] = useState(
    Boolean(SplashScreenComponent)
  )

  const initialValues = R.compose(
    R.mergeAll,
    R.map(({ code }) => ({ [code]: (value && value[code]) ?? '' }))
  )(elements)

  const values = R.merge(initialValues, value)

  const [saveError, setSaveError] = useState([])

  const saveNonEmptySecret = it => {
    const pendingElements = R.reduce((acc, value) => {
      if (value.pendingFieldName)
        acc.push(`${value.code}-${value.pendingFieldName}`)
      return acc
    }, [])(elements)
    const emptySecretFields = R.compose(
      R.map(R.prop('code')),
      R.filter(
        elem =>
          R.prop('component', elem) === SecretInput &&
          R.isEmpty(it[R.prop('code', elem)])
      )
    )(elements)
    return save(R.omit(R.concat(emptySecretFields, pendingElements), it)).catch(
      s => {
        setSaveError({ save: 'Failed to save changes' })
      }
    )
  }

  return (
    <>
      {showSplashScreen ? (
        <SplashScreenComponent
          classes={classes}
          onContinue={() => setShowSplashScreen(false)}
        />
      ) : (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          enableReinitialize
          initialValues={values}
          validationSchema={validationSchema}
          onSubmit={saveNonEmptySecret}>
          {({ values, errors, handleChange, setFieldValue }) => (
            <Form className={classes.form}>
              <Grid container spacing={3} className={classes.grid}>
                {elements.map(
                  ({
                    component,
                    code,
                    display,
                    settings,
                    inputProps,
                    isArray,
                    pendingFieldName
                  }) => (
                    <Grid item xs={xs} key={code}>
                      {isArray ? (
                        <div>
                          <Label1 noMargin>{display}</Label1>
                          <FieldArray
                            name={code}
                            render={arrayHelpers => (
                              <div className={classes.arrayList}>
                                {!R.isNil(values[code]) &&
                                R.length(values[code]) > 0 ? (
                                  values[code].map((it, idx) => (
                                    <div className={classes.arrayItem}>
                                      <FastField
                                        as={component}
                                        {...inputProps}
                                        name={`${code}[${idx}]`}
                                        value={values[code][idx]}
                                        settings={settings}
                                        fullWidth={true}
                                      />
                                      <DeleteButton
                                        type="button"
                                        onClick={() =>
                                          arrayHelpers.remove(idx)
                                        }>
                                        Delete item
                                      </DeleteButton>
                                    </div>
                                  ))
                                ) : (
                                  <></>
                                )}
                                <div className={classes.arrayItem}>
                                  <FastField
                                    as={component}
                                    {...inputProps}
                                    name={`${code}-${pendingFieldName}`}
                                    value={
                                      values[`${code}-${pendingFieldName}`]
                                    }
                                    settings={settings}
                                    fullWidth={true}
                                    onChange={e => {
                                      setFieldValue(
                                        `${code}-${pendingFieldName}`,
                                        e.target.value
                                      )
                                      return handleChange(e)
                                    }}
                                  />
                                  <AddButton
                                    type="button"
                                    disabled={
                                      R.isEmpty(
                                        values[`${code}-${pendingFieldName}`]
                                      ) ||
                                      R.isNil(
                                        values[`${code}-${pendingFieldName}`]
                                      )
                                    }
                                    onClick={() => {
                                      arrayHelpers.push(
                                        values[`${code}-${pendingFieldName}`]
                                      )
                                      setFieldValue(
                                        `${code}-${pendingFieldName}`,
                                        ''
                                      )
                                    }}>
                                    Add item
                                  </AddButton>
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      ) : (
                        <FastField
                          component={component}
                          {...inputProps}
                          name={code}
                          label={display}
                          settings={settings}
                          fullWidth={true}
                        />
                      )}
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
      )}
    </>
  )
}

export default FormRenderer
