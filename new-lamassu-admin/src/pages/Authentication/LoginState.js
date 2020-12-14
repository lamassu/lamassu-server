import { makeStyles } from '@material-ui/core/styles'
import axios from 'axios'
import React, { useState } from 'react'

import { Button } from 'src/components/buttons'
import { Checkbox, TextInput } from 'src/components/inputs/base'
import { Label2, P } from 'src/components/typography'

import styles from './Login.styles'

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const useStyles = makeStyles(styles)

const LoginState = ({
  clientField,
  onClientChange,
  passwordField,
  onPasswordChange,
  rememberMeField,
  onRememberMeChange,
  STATES,
  handleLoginState
}) => {
  const classes = useStyles()

  const [invalidLogin, setInvalidLogin] = useState(false)

  const handleClientChange = event => {
    onClientChange(event.target.value)
    setInvalidLogin(false)
  }

  const handlePasswordChange = event => {
    onPasswordChange(event.target.value)
    setInvalidLogin(false)
  }

  const handleRememberMeChange = () => {
    onRememberMeChange(!rememberMeField)
  }

  const handleLogin = () => {
    axios({
      method: 'POST',
      url: `${url}/api/login`,
      data: {
        username: clientField,
        password: passwordField,
        rememberMe: rememberMeField
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
          const status = res.status
          const message = res.data.message
          if (status === 200 && message === 'INPUT2FA')
            handleLoginState(STATES.INPUT_2FA)
          if (status === 200 && message === 'SETUP2FA')
            handleLoginState(STATES.SETUP_2FA)
        }
      })
      .catch(err => {
        if (err.response && err.response.data) {
          if (err.response.status === 403) setInvalidLogin(true)
        }
      })
  }

  return (
    <>
      <Label2 className={classes.inputLabel}>Client</Label2>
      <TextInput
        className={classes.input}
        error={invalidLogin}
        name="client-name"
        id="client-name"
        type="text"
        size="lg"
        onChange={handleClientChange}
        value={clientField}
      />
      <Label2 className={classes.inputLabel}>Password</Label2>
      <TextInput
        className={classes.input}
        error={invalidLogin}
        name="password"
        id="password"
        type="password"
        size="lg"
        onChange={handlePasswordChange}
        value={passwordField}
      />
      <div className={classes.rememberMeWrapper}>
        <Checkbox
          className={classes.checkbox}
          id="remember-me"
          onChange={handleRememberMeChange}
          value={rememberMeField}
        />
        <Label2 className={classes.inputLabel}>Keep me logged in</Label2>
      </div>
      <div className={classes.footer}>
        {invalidLogin && (
          <P className={classes.errorMessage}>
            Invalid login/password combination.
          </P>
        )}
        <Button
          onClick={() => {
            handleLogin()
          }}
          buttonClassName={classes.loginButton}>
          Login
        </Button>
      </div>
    </>
  )
}

export default LoginState
