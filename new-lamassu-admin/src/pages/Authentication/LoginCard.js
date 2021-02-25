import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'

import { H2 } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import Input2FAState from './Input2FAState'
import InputFIDOState from './InputFIDOState'
import styles from './Login.styles'
import LoginState from './LoginState'
import Setup2FAState from './Setup2FAState'

const useStyles = makeStyles(styles)

const STATES = {
  LOGIN: 'Login',
  SETUP_2FA: 'Setup 2FA',
  INPUT_2FA: 'Input 2FA',
  FIDO_2FA: 'FIDO 2FA'
}

// FIDO2FA, FIDOPasswordless or FIDOUsernameless
const AUTHENTICATION_STRATEGY = 'FIDOUsernameless'

const LoginCard = () => {
  const classes = useStyles()

  const [twoFAField, setTwoFAField] = useState('')
  const [clientField, setClientField] = useState('')
  const [passwordField, setPasswordField] = useState('')
  const [rememberMeField, setRememberMeField] = useState(false)
  const [loginState, setLoginState] = useState(STATES.LOGIN)

  const onClientChange = newValue => {
    setClientField(newValue)
  }

  const onPasswordChange = newValue => {
    setPasswordField(newValue)
  }

  const onRememberMeChange = newValue => {
    setRememberMeField(newValue)
  }

  const onTwoFAChange = newValue => {
    setTwoFAField(newValue)
  }

  const handleLoginState = newState => {
    setLoginState(newState)
  }

  const renderState = () => {
    switch (loginState) {
      case STATES.LOGIN:
        return (
          <LoginState
            onClientChange={onClientChange}
            onPasswordChange={onPasswordChange}
            onRememberMeChange={onRememberMeChange}
            STATES={STATES}
            strategy={AUTHENTICATION_STRATEGY}
            handleLoginState={handleLoginState}
          />
        )
      case STATES.INPUT_2FA:
        return (
          <Input2FAState
            twoFAField={twoFAField}
            onTwoFAChange={onTwoFAChange}
            clientField={clientField}
            passwordField={passwordField}
            rememberMeField={rememberMeField}
          />
        )
      case STATES.SETUP_2FA:
        return (
          <Setup2FAState
            clientField={clientField}
            passwordField={passwordField}
            STATES={STATES}
            handleLoginState={handleLoginState}
          />
        )
      case STATES.FIDO_2FA:
        return (
          <InputFIDOState
            clientField={clientField}
            passwordField={passwordField}
            rememberMeField={rememberMeField}
            strategy={AUTHENTICATION_STRATEGY}
          />
        )
      case STATES.FIDO_PASSWORDLESS:
        return <InputFIDOState strategy={AUTHENTICATION_STRATEGY} />
      default:
        break
    }
  }

  return (
    <Paper elevation={1}>
      <div className={classes.wrapper}>
        <div className={classes.titleWrapper}>
          <Logo className={classes.icon} />
          <H2 className={classes.title}>Lamassu Admin</H2>
        </div>
        {renderState()}
      </div>
    </Paper>
  )
}

export default LoginCard
