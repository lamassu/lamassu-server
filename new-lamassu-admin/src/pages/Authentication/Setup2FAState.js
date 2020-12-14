import { makeStyles } from '@material-ui/core/styles'
import axios from 'axios'
import QRCode from 'qrcode.react'
import React, { useState, useEffect } from 'react'

import { ActionButton, Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { Label2, P } from 'src/components/typography'
import { primaryColor } from 'src/styling/variables'

import styles from './Login.styles'

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

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

  useEffect(() => {
    get2FASecret()
  }, [])

  const get2FASecret = () => {
    axios({
      method: 'POST',
      url: `${url}/api/login/2fa/setup`,
      data: {
        username: clientField,
        password: passwordField
      },
      options: {
        withCredentials: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res) {
          setSecret(res.data.secret)
          setOtpauth(res.data.otpauth)
        }
      })
      .catch(err => {
        if (err.response && err.response.data) {
          if (err.response.status === 403) {
            handleLoginState(STATES.LOGIN)
          }
        }
      })
  }

  const save2FASecret = () => {
    axios({
      method: 'POST',
      url: `${url}/api/login/2fa/save`,
      data: {
        username: clientField,
        password: passwordField,
        secret: secret,
        code: twoFAConfirmation
      },
      options: {
        withCredentials: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) console.log(err)
        if (res) {
          const status = res.status
          if (status === 200) handleLoginState(STATES.LOGIN)
        }
      })
      .catch(err => {
        if (err.response && err.response.data) {
          if (err.response.status === 403) {
            setInvalidToken(true)
          }
        }
      })
  }

  return (
    <>
      {secret && otpauth ? (
        <>
          <div className={classes.infoWrapper}>
            <Label2 className={classes.info2}>
              We detected that this account does not have its two-factor
              authentication enabled. In order to protect the resources in the
              system, a two-factor authentication is enforced.
            </Label2>
            <Label2 className={classes.info2}>
              To finish this process, please scan the following QR code or
              insert the secret further below on an authentication app of your
              choice, preferably Google Authenticator or Authy.
            </Label2>
          </div>
          <div className={classes.qrCodeWrapper}>
            <QRCode size={240} fgColor={primaryColor} value={otpauth} />
          </div>
          <div className={classes.secretWrapper}>
            <Label2 className={classes.secretLabel}>Your secret:</Label2>
            <Label2
              className={isShowing ? classes.secret : classes.hiddenSecret}>
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
            {invalidToken && (
              <P className={classes.errorMessage}>
                Code is invalid. Please try again.
              </P>
            )}
            <Button
              onClick={() => {
                save2FASecret()
              }}
              buttonClassName={classes.loginButton}>
              Done
            </Button>
          </div>
        </>
      ) : (
        // TODO: should maybe show a spinner here?
        <div className={classes.twofaFooter}>
          <Button
            onClick={() => {
              console.log('response should be arriving soon')
            }}
            buttonClassName={classes.loginButton}>
            Generate Two Factor Authentication Secret
          </Button>
        </div>
      )}
    </>
  )
}

export default Setup2FAState
