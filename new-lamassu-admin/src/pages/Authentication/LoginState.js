import { useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { startAssertion } from '@simplewebauthn/browser'
import base64 from 'base-64'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import * as Yup from 'yup'

import AppContext from 'src/AppContext'
import { Button } from 'src/components/buttons'
import { Checkbox, SecretInput, TextInput } from 'src/components/inputs/formik'
import { Label3, P } from 'src/components/typography'

import styles from './shared.styles'

const useStyles = makeStyles(styles)

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`

const GENERATE_ASSERTION = gql`
  query generateAssertionOptions($domain: String!) {
    generateAssertionOptions(domain: $domain)
  }
`

const VALIDATE_ASSERTION = gql`
  mutation validateAssertion(
    $assertionResponse: JSONObject!
    $domain: String!
  ) {
    validateAssertion(assertionResponse: $assertionResponse, domain: $domain)
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
  email: Yup.string()
    .label('Email')
    .required()
    .email(),
  password: Yup.string().required('Password field is required'),
  rememberMe: Yup.boolean()
})

const initialValues = {
  email: '',
  password: '',
  rememberMe: false
}

const getErrorMsg = (formikErrors, formikTouched, mutationError) => {
  if (!formikErrors || !formikTouched) return null
  if (mutationError) return 'Invalid email/password combination'
  if (formikErrors.email && formikTouched.email) return formikErrors.email
  if (formikErrors.password && formikTouched.password)
    return formikErrors.password
  return null
}

const LoginState = ({ state, dispatch, strategy }) => {
  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

  const [login, { error: loginMutationError }] = useMutation(LOGIN)

  const submitLogin = async (username, password, rememberMe) => {
    const options = {
      variables: {
        username,
        password
      },
      context: {
        headers: {
          'Pazuz-Operator-Identifier': base64.encode(username)
        }
      }
    }
    const { data: loginResponse } = await login(options)

    if (!loginResponse.login) return

    return dispatch({
      type: loginResponse.login,
      payload: {
        clientField: username,
        passwordField: password,
        rememberMeField: rememberMe
      }
    })
  }

  const [validateAssertion, { error: FIDOMutationError }] = useMutation(
    VALIDATE_ASSERTION,
    {
      onCompleted: ({ validateAssertion: success }) => success && getUserData()
    }
  )

  const [assertionOptions, { error: assertionQueryError }] = useLazyQuery(
    GENERATE_ASSERTION,
    {
      onCompleted: ({ generateAssertionOptions: options }) => {
        startAssertion(options)
          .then(res => {
            validateAssertion({
              variables: {
                assertionResponse: res,
                domain: window.location.hostname
              }
            })
          })
          .catch(err => {
            console.error(err)
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

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={values =>
        submitLogin(values.email, values.password, values.rememberMe)
      }>
      {({ errors, touched }) => (
        <Form id="login-form">
          <Field
            name="email"
            label="Email"
            size="lg"
            component={TextInput}
            fullWidth
            autoFocus
            className={classes.input}
            error={getErrorMsg(
              errors,
              touched,
              loginMutationError ||
                FIDOMutationError ||
                assertionQueryError ||
                userDataQueryError
            )}
          />
          <Field
            name="password"
            size="lg"
            component={SecretInput}
            label="Password"
            fullWidth
            error={getErrorMsg(
              errors,
              touched,
              loginMutationError ||
                FIDOMutationError ||
                assertionQueryError ||
                userDataQueryError
            )}
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
            {getErrorMsg(
              errors,
              touched,
              loginMutationError ||
                FIDOMutationError ||
                assertionQueryError ||
                userDataQueryError
            ) && (
              <P className={classes.errorMessage}>
                {getErrorMsg(
                  errors,
                  touched,
                  loginMutationError ||
                    FIDOMutationError ||
                    assertionQueryError ||
                    userDataQueryError
                )}
              </P>
            )}
            {strategy !== 'FIDO2FA' && (
              <Button
                type="button"
                onClick={() => {
                  return strategy === 'FIDOUsernameless'
                    ? assertionOptions({
                        variables: { domain: window.location.hostname }
                      })
                    : dispatch({
                        type: 'FIDO',
                        payload: {}
                      })
                }}
                buttonClassName={classes.loginButton}
                className={classes.fidoLoginButtonWrapper}>
                I have a hardware key
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
