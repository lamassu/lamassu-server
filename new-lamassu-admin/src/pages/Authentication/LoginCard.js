import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import React, { useReducer } from 'react'

import { H5 } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import Input2FAState from './Input2FAState'
import LoginState from './LoginState'
import Setup2FAState from './Setup2FAState'
import styles from './shared.styles'
import { STATES } from './states'

const useStyles = makeStyles(styles)

const initialState = {
  twoFAField: '',
  clientField: '',
  passwordField: '',
  rememberMeField: false,
  loginState: STATES.LOGIN
}

const reducer = (state, action) => {
  const { type, payload } = action
  return { ...state, ...payload, loginState: type }
}

const LoginCard = () => {
  const classes = useStyles()

  const [state, dispatch] = useReducer(reducer, initialState)

  const renderState = () => {
    switch (state.loginState) {
      case STATES.LOGIN:
        return <LoginState state={state} dispatch={dispatch} />
      case STATES.INPUT_2FA:
        return <Input2FAState state={state} dispatch={dispatch} />
      case STATES.SETUP_2FA:
        return <Setup2FAState state={state} dispatch={dispatch} />
      default:
        break
    }
  }

  return (
    <Paper elevation={1}>
      <div className={classes.wrapper}>
        <div className={classes.titleWrapper}>
          <Logo className={classes.icon} />
          <H5 className={classes.title}>Lamassu Admin</H5>
        </div>
        {renderState()}
      </div>
    </Paper>
  )
}

export default LoginCard
