import { makeStyles, Grid } from '@material-ui/core'
import React from 'react'

import styles from './Login.styles'
import LoginCard from './LoginCard'

const useStyles = makeStyles(styles)

const Login = () => {
  const classes = useStyles()

  return (
    <>
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justify="center"
        style={{ minHeight: '100vh' }}
        className={classes.welcomeBackground}>
        <Grid>
          <LoginCard />
        </Grid>
      </Grid>
    </>
  )
}

export default Login
