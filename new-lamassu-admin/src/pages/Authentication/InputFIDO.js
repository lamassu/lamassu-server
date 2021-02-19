import { useMutation, useLazyQuery /*, useQuery */ } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { startAssertion } from '@simplewebauthn/browser'
import gql from 'graphql-tag'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import { AppContext } from 'src/App'
import { Button } from 'src/components/buttons'
import { H2, P } from 'src/components/typography'

import styles from './Login.styles'

const useStyles = makeStyles(styles)

const GENERATE_ASSERTION = gql`
  query generateAssertionOptions($username: String!, $password: String!) {
    generateAssertionOptions(username: $username, password: $password)
  }
`

const VALIDATE_ASSERTION = gql`
  mutation validateAssertion(
    $username: String!
    $password: String!
    $rememberMe: Boolean!
    $assertionResponse: JSONObject!
  ) {
    validateAssertion(
      username: $username
      password: $password
      rememberMe: $rememberMe
      assertionResponse: $assertionResponse
    )
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

const InputFIDO = ({ clientField, passwordField, rememberMeField }) => {
  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

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
      variables: {
        username: clientField,
        password: passwordField
      },
      onCompleted: ({ generateAssertionOptions: options }) => {
        console.log(options)
        startAssertion(options)
          .then(res => {
            validateAssertion({
              variables: {
                username: clientField,
                password: passwordField,
                rememberMe: rememberMeField,
                assertionResponse: res
              }
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

  const getErrorMsg = () => {
    if (assertionQueryError || queryError || mutationError)
      return 'Internal server error'
    if (invalidToken) return 'Code is invalid. Please try again.'
    return null
  }

  return (
    <>
      <H2 className={classes.info}>Insert your Yubikey and touch it</H2>
      <div className={classes.twofaFooter}>
        {getErrorMsg() && (
          <P className={classes.errorMessage}>{getErrorMsg()}</P>
        )}
        <Button
          onClick={() => assertionOptions()}
          buttonClassName={classes.loginButton}>
          Use FIDO
        </Button>
      </div>
    </>
  )
}

export default InputFIDO
