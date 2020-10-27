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

const ResetPassword = () => {
  const classes = useStyles()
  const history = useHistory()
  const query = useQuery()
  const [newPasswordField, setNewPasswordField] = useState('')
  const [confirmPasswordField, setConfirmPasswordField] = useState('')
  const [invalidPassword, setInvalidPassword] = useState(false)
  const [userID, setUserID] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [wasSuccessful, setSuccess] = useState(false)

  useEffect(() => {
    validateQuery()
  }, [])

  const validateQuery = () => {
    axios({
      url: `${url}/api/resetpassword?t=${query.get('t')}`,
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
            setUserID(res.data.userID)
          }
        }
      })
      .catch(err => {
        console.log(err)
        history.push('/')
      })
  }

  const handlePasswordReset = () => {
    if (!isValidPasswordChange()) return setInvalidPassword(true)
    axios({
      url: `${url}/api/updatepassword`,
      method: 'POST',
      data: {
        userID: userID,
        newPassword: newPasswordField
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
        history.push('/')
      })
  }

  const isValidPasswordChange = () => {
    return newPasswordField === confirmPasswordField
  }

  const handleNewPasswordChange = event => {
    setInvalidPassword(false)
    setNewPasswordField(event.target.value)
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
                    Insert new password
                  </Label2>
                  <TextInput
                    className={classes.input}
                    error={invalidPassword}
                    name="new-password"
                    autoFocus
                    id="new-password"
                    type="password"
                    size="lg"
                    onChange={handleNewPasswordChange}
                    value={newPasswordField}
                  />
                  <Label2 className={classes.inputLabel}>
                    Confirm new password
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
                        handlePasswordReset()
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

export default ResetPassword
