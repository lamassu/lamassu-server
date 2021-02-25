import { useMutation, useLazyQuery /*, useQuery */ } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { startAssertion } from '@simplewebauthn/browser'
import { Field, Form, Formik } from 'formik'
import gql from 'graphql-tag'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import * as Yup from 'yup'

import { AppContext } from 'src/App'
import { Button } from 'src/components/buttons'
import { Checkbox, TextInput } from 'src/components/inputs/formik'
import { H2, Label2, P } from 'src/components/typography'

import styles from './Login.styles'

const useStyles = makeStyles(styles)

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
  localClient: Yup.string()
    .required('Client field is required!')
    .email('Username field should be in an email format!'),
  localRememberMe: Yup.boolean()
})

const initialValues = {
  localClient: '',
  localRememberMe: false
}

const InputFIDOState = ({
  clientField,
  passwordField,
  rememberMeField,
  strategy
}) => {
  const GENERATE_ASSERTION = gql`
    query generateAssertionOptions($username: String!${
      strategy === 'FIDO2FA' ? `, $password: String!` : ``
    }) {
      generateAssertionOptions(username: $username${
        strategy === 'FIDO2FA' ? `, password: $password` : ``
      })
    }
  `

  const VALIDATE_ASSERTION = gql`
    mutation validateAssertion(
      $username: String!
      ${strategy === 'FIDO2FA' ? `, $password: String!` : ``}
      $rememberMe: Boolean!
      $assertionResponse: JSONObject!
    ) {
      validateAssertion(
        username: $username
        ${strategy === 'FIDO2FA' ? `password: $password` : ``}
        rememberMe: $rememberMe
        assertionResponse: $assertionResponse
      )
    }
  `

  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

  const [localClientField, setLocalClientField] = useState('')
  const [localRememberMeField, setLocalRememberMeField] = useState(false)
  const [invalidUsername, setInvalidUsername] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  const [validateAssertion, { error: mutationError }] = useMutation(
    VALIDATE_ASSERTION,
    {
      onCompleted: ({ validateAssertion: success }) => {
        success ? getUserData() : setInvalidToken(true)
      }
    }
  )

  const [assertionOptions, { error: assertionQueryError }] = useLazyQuery(
    GENERATE_ASSERTION,
    {
      variables:
        strategy === 'FIDO2FA'
          ? {
              username: clientField,
              password: passwordField
            }
          : {
              username: localClientField
            },
      onCompleted: ({ generateAssertionOptions: options }) => {
        console.log(options)
        startAssertion(options)
          .then(res => {
            const variables =
              strategy === 'FIDO2FA'
                ? {
                    username: clientField,
                    password: passwordField,
                    rememberMe: rememberMeField,
                    assertionResponse: res
                  }
                : {
                    username: localClientField,
                    rememberMe: localRememberMeField,
                    assertionResponse: res
                  }
            validateAssertion({
              variables
            })
          })
          .catch(err => {
            console.error(err)
            setInvalidToken(true)
          })
      }
    }
  )

  const [getUserData, { error: queryError }] = useLazyQuery(GET_USER_DATA, {
    onCompleted: ({ userData }) => {
      setUserData(userData)
      history.push('/')
    }
  })

  const getErrorMsg = (formikErrors, formikTouched) => {
    if (!formikErrors || !formikTouched) return null
    if (assertionQueryError || queryError || mutationError)
      return 'Internal server error'
    if (formikErrors.client && formikTouched.client) return formikErrors.client
    if (invalidUsername) return 'Invalid login.'
    if (invalidToken) return 'Code is invalid. Please try again.'
    return null
  }

  return (
    <>
      {strategy === 'FIDOPasswordless' && (
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={values => {
            setInvalidUsername(false)
            setLocalClientField(values.localClient)
            setLocalRememberMeField(values.localRememberMe)
            assertionOptions()
          }}>
          {({ errors, touched }) => (
            <Form id="fido-form">
              <Field
                name="localClient"
                label="Client"
                size="lg"
                component={TextInput}
                fullWidth
                autoFocus
                className={classes.input}
                error={getErrorMsg(errors, touched)}
                onKeyUp={() => {
                  if (invalidUsername) setInvalidUsername(false)
                }}
              />
              <div className={classes.rememberMeWrapper}>
                <Field
                  name="localRememberMe"
                  className={classes.checkbox}
                  component={Checkbox}
                />
                <Label2 className={classes.inputLabel}>
                  Keep me logged in
                </Label2>
              </div>
              <div className={classes.twofaFooter}>
                {getErrorMsg(errors, touched) && (
                  <P className={classes.errorMessage}>
                    {getErrorMsg(errors, touched)}
                  </P>
                )}
                <Button
                  type="submit"
                  form="fido-form"
                  buttonClassName={classes.loginButton}>
                  Use FIDO
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      )}
      {strategy === 'FIDO2FA' && (
        <>
          <H2 className={classes.info}>Insert your Yubikey and touch it</H2>
          <Button
            type="button"
            form="fido-form"
            onClick={() => assertionOptions()}
            buttonClassName={classes.loginButton}>
            Use FIDO
          </Button>
        </>
      )}
    </>
  )
}

export default InputFIDOState
