import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import base64 from 'base-64'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React from 'react'
import * as Yup from 'yup'

import { Button } from 'src/components/buttons'
import { Checkbox, SecretInput, TextInput } from 'src/components/inputs/formik'
import { Label3, P } from 'src/components/typography'

import styles from './shared.styles'
import { STATES } from './states'

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

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Invalid login/password combination'
  if (formikErrors.client && formikTouched.client) return formikErrors.client
  if (formikErrors.password && formikTouched.password)
    return formikErrors.password
  return null
}

const LoginState = ({ state, dispatch }) => {
  const classes = useStyles()

  const [login, { error: mutationError }] = useMutation(LOGIN)

  const submitLogin = async (username, password, rememberMe) => {
    const { data: loginResponse } = await login({
      variables: {
        username,
        password
      },
      context: {
        headers: {
          pazuz_operatoridentifier: base64.encode(username)
        }
      }
    })

    if (!loginResponse.login) return

    const stateVar =
      loginResponse.login === 'INPUT2FA' ? STATES.INPUT_2FA : STATES.SETUP_2FA

    return dispatch({
      type: stateVar,
      payload: {
        clientField: username,
        passwordField: password,
        rememberMeField: rememberMe
      }
    })
  }

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={values =>
        submitLogin(values.client, values.password, values.rememberMe)
      }>
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
            error={getErrorMsg(errors, touched, mutationError)}
          />
          <Field
            name="password"
            size="lg"
            component={SecretInput}
            label="Password"
            fullWidth
            error={getErrorMsg(errors, touched, mutationError)}
          />
          <div className={classes.rememberMeWrapper}>
            <Field
              name="rememberMe"
              className={classes.checkbox}
              component={Checkbox}
            />
            <Label3>Keep me logged in</Label3>
          </div>
          <div className={classes.footer}>
            {getErrorMsg(errors, touched, mutationError) && (
              <P className={classes.errorMessage}>
                {getErrorMsg(errors, touched, mutationError)}
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
