import { useMutation, useQuery, useLazyQuery, gql } from '@apollo/client'
import { makeStyles } from '@material-ui/core/styles'
import base64 from 'base-64'
import { Form, Formik } from 'formik'
import QRCode from 'qrcode.react'
import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'

import AppContext from 'src/AppContext'
import { ActionButton, Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { Label3, P } from 'src/components/typography'
import { primaryColor } from 'src/styling/variables'

import styles from './shared.styles'

const SETUP_2FA = gql`
  mutation setup2FA(
    $username: String!
    $password: String!
    $rememberMe: Boolean!
    $codeConfirmation: String!
  ) {
    setup2FA(
      username: $username
      password: $password
      rememberMe: $rememberMe
      codeConfirmation: $codeConfirmation
    )
  }
`

const GET_2FA_SECRET = gql`
  query get2FASecret($username: String!, $password: String!) {
    get2FASecret(username: $username, password: $password) {
      secret
      otpauth
    }
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

const useStyles = makeStyles(styles)

const Setup2FAState = ({ state, dispatch }) => {
  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

  const [secret, setSecret] = useState(null)
  const [otpauth, setOtpauth] = useState(null)
  const [isShowing, setShowing] = useState(false)

  const [invalidToken, setInvalidToken] = useState(false)
  const [twoFAConfirmation, setTwoFAConfirmation] = useState('')

  const handle2FAChange = value => {
    setTwoFAConfirmation(value)
    setInvalidToken(false)
  }

  const queryOptions = {
    variables: { username: state.clientField, password: state.passwordField },
    context: {
      headers: {
        'Pazuz-Operator-Identifier': base64.encode(state.clientField)
      }
    },
    onCompleted: ({ get2FASecret }) => {
      setSecret(get2FASecret.secret)
      setOtpauth(get2FASecret.otpauth)
    }
  }

  const mutationOptions = {
    variables: {
      username: state.clientField,
      password: state.passwordField,
      rememberMe: state.rememberMeField,
      codeConfirmation: twoFAConfirmation
    },
    context: {
      headers: {
        'Pazuz-Operator-Identifier': base64.encode(state.clientField)
      }
    }
  }

  const { error: queryError } = useQuery(GET_2FA_SECRET, queryOptions)

  const [getUserData] = useLazyQuery(GET_USER_DATA, {
    onCompleted: ({ userData }) => {
      setUserData(userData)
      history.push('/')
    }
  })

  const [setup2FA, { error: mutationError }] = useMutation(SETUP_2FA, {
    onCompleted: ({ setup2FA: success }) => {
      const options = {
        context: {
          headers: {
            'Pazuz-Operator-Identifier': base64.encode(state.clientField)
          }
        }
      }
      success ? getUserData(options) : setInvalidToken(true)
    }
  })

  const getErrorMsg = () => {
    if (mutationError || queryError) return 'Internal server error.'
    if (twoFAConfirmation.length !== 6 && invalidToken)
      return 'The code should have 6 characters!'
    if (invalidToken) return 'Code is invalid. Please try again.'
    return null
  }

  const handleSubmit = () => {
    if (twoFAConfirmation.length !== 6) {
      setInvalidToken(true)
      return
    }
    setup2FA(mutationOptions)
  }

  return (
    secret &&
    otpauth && (
      <>
        <div className={classes.infoWrapper}>
          <Label3 className={classes.info2}>
            This account does not yet have two-factor authentication enabled. To
            secure the admin, two-factor authentication is required.
          </Label3>
          <Label3 className={classes.info2}>
            To complete the registration process, scan the following QR code or
            insert the secret below on a 2FA app, such as Google Authenticator
            or AndOTP.
          </Label3>
        </div>
        <div className={classes.qrCodeWrapper}>
          <QRCode size={240} fgColor={primaryColor} value={otpauth} />
        </div>
        <div className={classes.secretWrapper}>
          <Label3 className={classes.secretLabel}>Your secret:</Label3>
          <Label3 className={isShowing ? classes.secret : classes.hiddenSecret}>
            {secret}
          </Label3>
          <ActionButton
            disabled={!secret && !otpauth}
            color="primary"
            onClick={() => {
              setShowing(!isShowing)
            }}>
            {isShowing ? 'Hide' : 'Show'}
          </ActionButton>
        </div>
        <div className={classes.confirm2FAInput}>
          {/* TODO: refactor the 2FA CodeInput to properly use Formik */}
          <Formik onSubmit={() => {}} initialValues={{}}>
            <Form>
              <CodeInput
                name="2fa"
                value={twoFAConfirmation}
                onChange={handle2FAChange}
                numInputs={6}
                error={invalidToken}
                shouldAutoFocus
              />
              <button onClick={handleSubmit} className={classes.enterButton} />
            </Form>
          </Formik>
        </div>
        <div className={classes.twofaFooter}>
          {getErrorMsg() && (
            <P className={classes.errorMessage}>{getErrorMsg()}</P>
          )}
          <Button onClick={handleSubmit} buttonClassName={classes.loginButton}>
            Done
          </Button>
        </div>
      </>
    )
  )
}

export default Setup2FAState
