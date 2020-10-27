import { makeStyles, Grid } from '@material-ui/core'
import Paper from '@material-ui/core/Paper'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import { Button } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs/base'
import { H2, Label2, P } from 'src/components/typography'
import { ReactComponent as Logo } from 'src/styling/icons/menu/logo.svg'

import styles from './Login.styles'

const useQuery = () => new URLSearchParams(useLocation().search)
const useStyles = makeStyles(styles)

const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const Register = () => {
  const classes = useStyles()
  const history = useHistory()
  const query = useQuery()
  const [passwordField, setPasswordField] = useState('')
  const [confirmPasswordField, setConfirmPasswordField] = useState('')
  const [invalidPassword, setInvalidPassword] = useState(false)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [wasSuccessful, setSuccess] = useState(false)

  useEffect(() => {
    validateQuery()
  }, [])

  const validateQuery = () => {
    axios({
      url: `${url}/api/register?t=${query.get('t')}`,
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
            setSuccess(true)
            setUsername(res.data.username)
            setRole(res.data.role)
          }
        }
      })
      .catch(err => {
        console.log(err)
        history.push('/')
      })
  }

  const handleRegister = () => {
    if (!isValidPassword()) return setInvalidPassword(true)
    axios({
      url: `${url}/api/register`,
      method: 'POST',
      data: {
        username: username,
        password: passwordField,
        role: role
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res, err) => {
        if (err) return
        if (res && res.status === 200) {
          history.push('/wizard', { fromAuthRegister: true })
        }
      })
      .catch(err => {
        console.log(err)
        history.push('/')
      })
  }

  const isValidPassword = () => {
    return passwordField === confirmPasswordField
  }

  const handlePasswordChange = event => {
    setInvalidPassword(false)
    setPasswordField(event.target.value)
  }

  const handleConfirmPasswordChange = event => {
    setInvalidPassword(false)
    setConfirmPasswordField(event.target.value)
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
                  <Label2 className={classes.inputLabel}>
                    Insert a password
                  </Label2>
                  <TextInput
                    className={classes.input}
                    error={invalidPassword}
                    name="new-password"
                    autoFocus
                    id="new-password"
                    type="password"
                    size="lg"
                    onChange={handlePasswordChange}
                    value={passwordField}
                  />
                  <Label2 className={classes.inputLabel}>
                    Confirm password
                  </Label2>
                  <TextInput
                    className={classes.input}
                    error={invalidPassword}
                    name="confirm-password"
                    id="confirm-password"
                    type="password"
                    size="lg"
                    onChange={handleConfirmPasswordChange}
                    value={confirmPasswordField}
                  />
                  <div className={classes.footer}>
                    {invalidPassword && (
                      <P className={classes.errorMessage}>
                        Passwords do not match!
                      </P>
                    )}
                    <Button
                      onClick={() => {
                        handleRegister()
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

export default Register
