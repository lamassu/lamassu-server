import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { Button } from 'src/components/buttons'
import { Checkbox, SecretInput, TextInput } from 'src/components/inputs/formik'
import { Label2, P } from 'src/components/typography'

import styles from './Login.styles'

const useStyles = makeStyles(styles)

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`

const validationSchema = Yup.object().shape({
  client: Yup.string()
    .required('Client field is required!')
    .email('Username field should be in an email format!'),
  password: Yup.string().required('Password field is required'),
  rememberMe: Yup.boolean()
})

const initialValues = {
  client: '',
  password: '',
  rememberMe: false
}

const LoginState = ({
  onClientChange,
  onPasswordChange,
  onRememberMeChange,
  STATES,
  handleLoginState
}) => {
  const classes = useStyles()

  const [login, { error: mutationError }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      if (login === 'INPUT2FA') handleLoginState(STATES.INPUT_2FA)
      if (login === 'SETUP2FA') handleLoginState(STATES.SETUP_2FA)
      if (login === 'FAILED') setInvalidLogin(true)
    }
  })

  const [invalidLogin, setInvalidLogin] = useState(false)

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (mutationError) return 'Internal server error'
    if (formikErrors.client && formikTouched.client) return formikErrors.client
    if (formikErrors.password && formikTouched.password)
      return formikErrors.password
    if (invalidLogin) return 'Invalid login/password combination'
    return null
  }

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={values => {
        setInvalidLogin(false)
        onClientChange(values.client)
        onPasswordChange(values.password)
        onRememberMeChange(values.rememberMe)
        login({
          variables: {
            username: values.client,
            password: values.password
          }
        })
      }}>
      {({ errors, touched }) => (
        <Form id="login-form">
          <Field
            name="client"
            label="Client"
            size="lg"
            component={TextInput}
            fullWidth
            autoFocus
            className={classes.input}
            error={getErrorMsg(errors, touched)}
            onKeyUp={() => {
              if (invalidLogin) setInvalidLogin(false)
            }}
          />
          <Field
            name="password"
            size="lg"
            component={SecretInput}
            label="Password"
            fullWidth
            error={getErrorMsg(errors, touched)}
            onKeyUp={() => {
              if (invalidLogin) setInvalidLogin(false)
            }}
          />
          <div className={classes.rememberMeWrapper}>
            <Field
              name="rememberMe"
              className={classes.checkbox}
              component={Checkbox}
            />
            <Label2 className={classes.inputLabel}>Keep me logged in</Label2>
          </div>
          <div className={classes.footer}>
            {getErrorMsg(errors, touched) && (
              <P className={classes.errorMessage}>
                {getErrorMsg(errors, touched)}
              </P>
            )}
            <Button
              type="submit"
              form="login-form"
              buttonClassName={classes.loginButton}>
              Login
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default LoginState
