import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import * as Yup from 'yup'

import { Button } from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik/'
import { H2, Label3, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import styles from './shared.styles'

const useStyles = makeStyles(styles)

const VALIDATE_RESET_PASSWORD_LINK = gql`
  query validateResetPasswordLink($token: String!) {
    validateResetPasswordLink(token: $token) {
      id
    }
  }
`

const RESET_PASSWORD = gql`
  mutation resetPassword($token: String!, $userID: ID!, $newPassword: String!) {
    resetPassword(token: $token, userID: $userID, newPassword: $newPassword)
  }
`

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .required('A new password is required')
    .test(
      'len',
      'New password must contain more than 8 characters',
      val => val.length >= 8
    ),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password'), null],
    'Passwords must match'
  )
})

const initialValues = {
  password: '',
  confirmPassword: ''
}

const ResetPassword = () => {
  const classes = useStyles()
  const history = useHistory()
  const QueryParams = () => new URLSearchParams(useLocation().search)
  const token = QueryParams().get('t')
  const [userID, setUserID] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [wasSuccessful, setSuccess] = useState(false)

  useQuery(VALIDATE_RESET_PASSWORD_LINK, {
    variables: { token: token },
    onCompleted: ({ validateResetPasswordLink: info }) => {
      setLoading(false)
      if (!info) {
        setSuccess(false)
      } else {
        setSuccess(true)
        setUserID(info.id)
      }
    },
    onError: () => {
      setLoading(false)
      setSuccess(false)
    }
  })

  const [resetPassword, { error }] = useMutation(RESET_PASSWORD, {
    onCompleted: ({ resetPassword: success }) => {
      if (success) history.push('/')
    }
  })

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (error) return 'Internal server error'
    if (formikErrors.password && formikTouched.password)
      return formikErrors.password
    if (formikErrors.confirmPassword && formikTouched.confirmPassword)
      return formikErrors.confirmPassword
    return null
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justify="center"
      className={classes.welcomeBackground}>
      <Grid>
        <div>
          <Paper elevation={1}>
            <div className={classes.wrapper}>
              <div className={classes.titleWrapper}>
                <Logo className={classes.icon} />
                <H2 className={classes.title}>Lamassu Admin</H2>
              </div>
              {!isLoading && wasSuccessful && (
                <Formik
                  validationSchema={validationSchema}
                  initialValues={initialValues}
                  onSubmit={values => {
                    resetPassword({
                      variables: {
                        token: token,
                        userID: userID,
                        newPassword: values.confirmPassword
                      }
                    })
                  }}>
                  {({ errors, touched }) => (
                    <Form id="reset-password">
                      <Field
                        name="password"
                        autoFocus
                        size="lg"
                        component={SecretInput}
                        label="New password"
                        fullWidth
                        className={classes.input}
                      />
                      <Field
                        name="confirmPassword"
                        size="lg"
                        component={SecretInput}
                        label="Confirm your password"
                        fullWidth
                      />
                      <div className={classes.footer}>
                        {getErrorMsg(errors, touched) && (
                          <P className={classes.errorMessage}>
                            {getErrorMsg(errors, touched)}
                          </P>
                        )}
                        <Button
                          type="submit"
                          form="reset-password"
                          buttonClassName={classes.loginButton}>
                          Done
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
              {!isLoading && !wasSuccessful && (
                <>
                  <Label3>Link has expired</Label3>
                </>
              )}
            </div>
          </Paper>
        </div>
      </Grid>
    </Grid>
  )
}

export default ResetPassword
