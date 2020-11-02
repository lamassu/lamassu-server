import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import TitleSection from 'src/components/layout/TitleSection'

import Alerts from './Alerts'
import styles from './Dashboard.styles'
import SystemPerformance from './SystemPerformance'

const useStyles = makeStyles(styles)

const Dashboard = () => {
  const classes = useStyles()
  return (
    <>
      <TitleSection title="Dashboard" />
      <div className={classes.root}>
        <Grid container>
          <Grid item xs={6}>
            <Grid item style={{ marginRight: 24 }}>
              <div className={classes.card}>
                <SystemPerformance />
              </div>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Grid item style={{ marginBottom: 16 }}>
              <div className={classes.card}>
                <Alerts />{' '}
              </div>
            </Grid>
            <Grid item>
              <div className={classes.card}>2 </div>
            </Grid>
          </Grid>
        </Grid>
      </div>
    </>
  )
}

export default Dashboard
