import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import TitleSection from 'src/components/layout/TitleSection'

import styles from './Dashboard.styles'
import SystemPerformance from './SystemPerformance'
const useStyles = makeStyles(styles)

const Dashboard = () => {
  const classes = useStyles()
  return (
    <>
      <TitleSection title="Dashboard" />
      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs>
            <div className={classes.card}>
              <SystemPerformance />
            </div>
          </Grid>
          <Grid item xs>
            <div className={classes.card}>asdasdasd</div>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs>
            <div className={classes.card}>asdasdasd</div>
          </Grid>
          <Grid item xs>
            <div className={classes.card}>asdasdasd</div>
          </Grid>
        </Grid>
      </div>
    </>
  )
}

export default Dashboard
