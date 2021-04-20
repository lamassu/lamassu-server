import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import gql from 'graphql-tag'
import QRCode from 'qrcode.react'
import React, { useReducer, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import { ActionButton, Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { H2, Label2, Label3, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'
import { primaryColor } from 'src/styling/variables'

import styles from './shared.styles'

const useStyles = makeStyles(styles)

const VALIDATE_RESET_2FA_LINK = gql`
  query validateReset2FALink($token: String!) {
    validateReset2FALink(token: $token) {
      user_id
      secret
      otpauth
    }
  }
`

const RESET_2FA = gql`
  mutation reset2FA($token: String!, $userID: ID!, $code: String!) {
    reset2FA(token: $token, userID: $userID, code: $code)
  }
`

const initialState = {
  userID: null,
  secret: null,
  otpauth: null,
  result: null
}

const reducer = (state, action) => {
  const { type, payload } = action
  return { ...state, ...payload, result: type }
}

const Reset2FA = () => {
  const classes = useStyles()
  const history = useHistory()
  const QueryParams = () => new URLSearchParams(useLocation().search)
  const token = QueryParams().get('t')

  const [isShowing, setShowing] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [twoFAConfirmation, setTwoFAConfirmation] = useState('')

  const [state, dispatch] = useReducer(reducer, initialState)

  const handle2FAChange = value => {
    setTwoFAConfirmation(value)
    setInvalidToken(false)
  }

  const { error: queryError, loading } = useQuery(VALIDATE_RESET_2FA_LINK, {
    variables: { token: token },
    onCompleted: ({ validateReset2FALink: info }) => {
      if (!info) {
        dispatch({
          type: 'failure'
        })
      } else {
        dispatch({
          type: 'success',
          payload: {
            userID: info.user_id,
            secret: info.secret,
            otpauth: info.otpauth
          }
        })
      }
    },
    onError: () => {
      dispatch({
        type: 'failure'
      })
    }
  })

  const [reset2FA, { error: mutationError }] = useMutation(RESET_2FA, {
    onCompleted: ({ reset2FA: success }) => {
      success ? history.push('/') : setInvalidToken(true)
    }
  })

  const getErrorMsg = () => {
    if (queryError) return 'Internal server error'
    if (twoFAConfirmation.length !== 6 && invalidToken)
      return 'The code should have 6 characters!'
    if (mutationError || invalidToken)
      return 'Code is invalid. Please try again.'
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
              {!loading && state.result === 'success' && (
                <>
                  <div className={classes.infoWrapper}>
                    <Label2 className={classes.info2}>
                      To finish this process, please scan the following QR code
                      or insert the secret further below on an authentication
                      app of your choice, such Google Authenticator or Authy.
                    </Label2>
                  </div>
                  <div className={classes.qrCodeWrapper}>
                    <QRCode
                      size={240}
                      fgColor={primaryColor}
                      value={state.otpauth}
                    />
                  </div>
                  <div className={classes.secretWrapper}>
                    <Label2 className={classes.secretLabel}>
                      Your secret:
                    </Label2>
                    <Label2
                      className={
                        isShowing ? classes.secret : classes.hiddenSecret
                      }>
                      {state.secret}
                    </Label2>
                    <ActionButton
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
                        reset2FA({
                          variables: {
                            token: token,
                            userID: state.userID,
                            code: twoFAConfirmation
                          }
                        })
                      }}
                      buttonClassName={classes.loginButton}>
                      Done
                    </Button>
                  </div>
                </>
              )}
              {!loading && state.result === 'failure' && (
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

export default Reset2FA
