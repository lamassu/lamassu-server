import { useMutation, useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import { AppContext } from 'src/App'
import { H2, P } from 'src/components/typography'

import styles from './Login.styles'

const useStyles = makeStyles(styles)

const INPUT_FIDO = gql`
  mutation inputFIDO(
    $username: String!
    $password: String!
    $rememberMe: Boolean!
  ) {
    inputFIDO(username: $username, password: $password, rememberMe: $rememberMe)
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

  const [inputFIDO, { error: mutationError }] = useMutation(INPUT_FIDO, {
    onCompleted: ({ input2FA: success }) => {
      success ? getUserData() : setInvalidToken(true)
    }
  })

  const [getUserData, { error: queryError }] = useLazyQuery(GET_USER_DATA, {
    onCompleted: ({ userData }) => {
      setUserData(userData)
      history.push('/')
    }
  })

  inputFIDO({
    variables: {
      username: clientField,
      password: passwordField,
      rememberMe: rememberMeField
    }
  })

  const getErrorMsg = () => {
    if (mutationError || queryError) return 'Internal server error'
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
      </div>
    </>
  )
}

export default InputFIDO
