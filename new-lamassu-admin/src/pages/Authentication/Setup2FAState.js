import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import React, { useState } from 'react'

import { ActionButton, Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { Label2, P } from 'src/components/typography'
import { primaryColor } from 'src/styling/variables'

import styles from './Login.styles'

const SETUP_2FA = gql`
  mutation setup2FA(
    $username: String!
    $password: String!
    $secret: String!
    $codeConfirmation: String!
  ) {
    setup2FA(
      username: $username
      password: $password
      secret: $secret
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

const useStyles = makeStyles(styles)

const Setup2FAState = ({
  clientField,
  passwordField,
  STATES,
  handleLoginState
}) => {
  const classes = useStyles()

  const [secret, setSecret] = useState(null)
  const [otpauth, setOtpauth] = useState(null)
  const [isShowing, setShowing] = useState(false)

  const [invalidToken, setInvalidToken] = useState(false)
  const [twoFAConfirmation, setTwoFAConfirmation] = useState('')

  const handle2FAChange = value => {
    setTwoFAConfirmation(value)
    setInvalidToken(false)
  }

  const { error: queryError } = useQuery(GET_2FA_SECRET, {
    variables: { username: clientField, password: passwordField },
    onCompleted: ({ get2FASecret }) => {
      setSecret(get2FASecret.secret)
      setOtpauth(get2FASecret.otpauth)
    }
  })

  const [setup2FA, { error: mutationError }] = useMutation(SETUP_2FA, {
    onCompleted: ({ setup2FA: success }) => {
      success ? handleLoginState(STATES.LOGIN) : setInvalidToken(true)
    }
  })

  const getErrorMsg = () => {
    if (mutationError || queryError) return 'Internal server error'
    if (twoFAConfirmation.length !== 6 && invalidToken)
      return 'The code should have 6 characters!'
    if (invalidToken) return 'Code is invalid. Please try again.'
    return null
  }

  return (
    secret &&
    otpauth && (
      <>
        <div className={classes.infoWrapper}>
          <Label2 className={classes.info2}>
            We detected that this account does not have its two-factor
            authentication enabled. In order to protect the resources in the
            system, a two-factor authentication is enforced.
          </Label2>
          <Label2 className={classes.info2}>
            To finish this process, please scan the following QR code or insert
            the secret further below on an authentication app of your choice,
            such as Google Authenticator or Authy.
          </Label2>
        </div>
        <div className={classes.qrCodeWrapper}>
          <QRCode size={240} fgColor={primaryColor} value={otpauth} />
        </div>
        <div className={classes.secretWrapper}>
          <Label2 className={classes.secretLabel}>Your secret:</Label2>
          <Label2 className={isShowing ? classes.secret : classes.hiddenSecret}>
            {secret}
          </Label2>
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
          <CodeInput
            name="2fa"
            value={twoFAConfirmation}
            onChange={handle2FAChange}
            numInputs={6}
            error={invalidToken}
            shouldAutoFocus
          />
        </div>
        <div className={classes.twofaFooter}>
          {getErrorMsg() && (
            <P className={classes.errorMessage}>{getErrorMsg()}</P>
          )}
          <Button
            onClick={() => {
              if (twoFAConfirmation.length !== 6) {
                setInvalidToken(true)
                return
              }
              setup2FA({
                variables: {
                  username: clientField,
                  password: passwordField,
                  secret: secret,
                  codeConfirmation: twoFAConfirmation
                }
              })
            }}
            buttonClassName={classes.loginButton}>
            Done
          </Button>
        </div>
      </>
    )
  )
}

export default Setup2FAState
