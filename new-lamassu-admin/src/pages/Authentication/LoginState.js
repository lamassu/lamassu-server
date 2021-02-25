import { useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { startAssertion } from '@simplewebauthn/browser'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import * as Yup from 'yup'

import { AppContext } from 'src/App'
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

const GENERATE_ASSERTION = gql`
  query generateAssertionOptions {
    generateAssertionOptions
  }
`

const VALIDATE_ASSERTION = gql`
  mutation validateAssertion($assertionResponse: JSONObject!) {
    validateAssertion(assertionResponse: $assertionResponse)
  }
`

const GET_USER_DATA = gql`
  {
    userData {
      id
      username
      role
    }
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
  strategy,
  handleLoginState
}) => {
  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

  const [login, { error: loginMutationError }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      if (login === 'INPUT2FA') handleLoginState(STATES.INPUT_2FA)
      if (login === 'SETUP2FA') handleLoginState(STATES.SETUP_2FA)
      if (login === 'FIDO2FA') handleLoginState(STATES.FIDO_2FA)
      if (login === 'FAILED') setInvalidLogin(true)
    }
  })

  const [validateAssertion, { error: FIDOMutationError }] = useMutation(
    VALIDATE_ASSERTION,
    {
      onCompleted: ({ validateAssertion: success }) => {
        success ? getUserData() : setInvalidLogin(true)
      }
    }
  )

  const [assertionOptions, { error: assertionQueryError }] = useLazyQuery(
    GENERATE_ASSERTION,
    {
      onCompleted: ({ generateAssertionOptions: options }) => {
        console.log(options)
        startAssertion(options)
          .then(res => {
            validateAssertion({
              variables: {
                assertionResponse: res
              }
            })
          })
          .catch(err => {
            console.error(err)
            setInvalidLogin(true)
          })
      }
    }
  )

  const [getUserData, { error: userDataQueryError }] = useLazyQuery(
    GET_USER_DATA,
    {
      onCompleted: ({ userData }) => {
        setUserData(userData)
        history.push('/')
      }
    }
  )

  const [invalidLogin, setInvalidLogin] = useState(false)

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (
      loginMutationError ||
      FIDOMutationError ||
      assertionQueryError ||
      userDataQueryError
    )
      return 'Internal server error'
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
            {strategy !== 'FIDO2FA' && (
              <Button
                type="button"
                onClick={() => {
                  return strategy === 'FIDOUsernameless'
                    ? assertionOptions()
                    : handleLoginState(STATES.FIDO_2FA)
                }}
                buttonClassName={classes.loginButton}
                className={classes.fidoLoginButtonWrapper}>
                I have a YubiKey
              </Button>
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
