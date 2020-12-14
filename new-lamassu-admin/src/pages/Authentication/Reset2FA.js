import { makeStyles, Grid } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import axios from 'axios'
import QRCode from 'qrcode.react'
import React, { useState, useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import { ActionButton, Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { H2, Label2, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'
import { primaryColor } from 'src/styling/variables'

import styles from './Login.styles'

const useQuery = () => new URLSearchParams(useLocation().search)
const useStyles = makeStyles(styles)

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const Reset2FA = () => {
  const classes = useStyles()
  const history = useHistory()
  const query = useQuery()
  const [userID, setUserID] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [wasSuccessful, setSuccess] = useState(false)
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
    validateQuery()
  }, [])

  const validateQuery = () => {
    axios({
      url: `${url}/api/reset2fa?t=${query.get('t')}`,
      method: 'GET',
      options: {
        withCredentials: true
      }
    })
      .then((res, err) => {
        if (err) return
        if (res && res.status === 200) {
          setLoading(false)
          if (res.data === 'The link has expired') setSuccess(false)
          else {
            setUserID(res.data.userID)
            setSecret(res.data.secret)
            setOtpauth(res.data.otpauth)
            setSuccess(true)
          }
        }
      })
      .catch(err => {
        console.log(err)
        history.push('/')
      })
  }

  const handle2FAReset = () => {
    axios({
      url: `${url}/api/update2fa`,
      method: 'POST',
      data: {
        userID: userID,
        secret: secret,
        code: twoFAConfirmation
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res && res.status === 200) {
          history.push('/')
        }
      })
      .catch(err => {
        console.log(err)
        setInvalidToken(true)
      })
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justify="center"
      style={{ minHeight: '100vh' }}
      className={classes.welcomeBackground}>
      <Grid>
        <div>
          <Paper elevation={1}>
            <div className={classes.wrapper}>
              <div className={classes.titleWrapper}>
                <Logo className={classes.icon} />
                <H2 className={classes.title}>Lamassu Admin</H2>
              </div>
              {!isLoading && wasSuccessful && (
                <>
                  <div className={classes.infoWrapper}>
                    <Label2 className={classes.info2}>
                      To finish this process, please scan the following QR code
                      or insert the secret further below on an authentication
                      app of your choice, preferably Google Authenticator or
                      Authy.
                    </Label2>
                  </div>
                  <div className={classes.qrCodeWrapper}>
                    <QRCode size={240} fgColor={primaryColor} value={otpauth} />
                  </div>
                  <div className={classes.secretWrapper}>
                    <Label2 className={classes.secretLabel}>
                      Your secret:
                    </Label2>
                    <Label2
                      className={
                        isShowing ? classes.secret : classes.hiddenSecret
                      }>
                      {secret}
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
                    {invalidToken && (
                      <P className={classes.errorMessage}>
                        Code is invalid. Please try again.
                      </P>
                    )}
                    <Button
                      onClick={() => {
                        handle2FAReset()
                      }}
                      buttonClassName={classes.loginButton}>
                      Done
                    </Button>
                  </div>
                </>
              )}
              {!isLoading && !wasSuccessful && (
                <>
                  <Label2 className={classes.inputLabel}>
                    Link has expired
                  </Label2>
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
