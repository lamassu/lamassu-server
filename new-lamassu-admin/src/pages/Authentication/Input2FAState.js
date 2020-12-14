import { makeStyles } from '@material-ui/core/styles'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { AppContext } from 'src/App'
import { Button } from 'src/components/buttons'
import { CodeInput } from 'src/components/inputs/base'
import { H2, P } from 'src/components/typography'

import styles from './Login.styles'

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const useStyles = makeStyles(styles)

const Input2FAState = ({
  twoFAField,
  onTwoFAChange,
  clientField,
  passwordField,
  rememberMeField
}) => {
  const classes = useStyles()
  const history = useHistory()
  const { setUserData } = useContext(AppContext)

  const [invalidToken, setInvalidToken] = useState(false)

  const handle2FAChange = value => {
    onTwoFAChange(value)
    setInvalidToken(false)
  }

  const handle2FA = () => {
    axios({
      method: 'POST',
      url: `${url}/api/login/2fa`,
      data: {
        username: clientField,
        password: passwordField,
        rememberMe: rememberMeField,
        twoFACode: twoFAField
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res) {
          const status = res.status
          if (status === 200) {
            getUserData()
            history.push('/')
          }
        }
      })
      .catch(err => {
        if (err.response && err.response.data) {
          if (err.response.status === 403) {
            onTwoFAChange('')
            setInvalidToken(true)
          }
        }
      })
  }

  const getUserData = () => {
    axios({
      method: 'GET',
      url: `${url}/user-data`,
      withCredentials: true
    })
      .then(res => {
        if (res.status === 200) setUserData(res.data.user)
      })
      .catch(err => {
        if (err.status === 403) setUserData(null)
      })
  }

  return (
    <>
      <H2 className={classes.info}>
        Enter your two-factor authentication code
      </H2>
      <CodeInput
        name="2fa"
        value={twoFAField}
        onChange={handle2FAChange}
        numInputs={6}
        error={invalidToken}
        shouldAutoFocus
      />
      <div className={classes.twofaFooter}>
        {invalidToken && (
          <P className={classes.errorMessage}>
            Code is invalid. Please try again.
          </P>
        )}
        <Button
          onClick={() => {
            handle2FA()
          }}
          buttonClassName={classes.loginButton}>
          Login
        </Button>
      </div>
    </>
  )
}

export default Input2FAState
