import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'

import Alerts from './Alerts'
import styles from './Dashboard.styles'
import SystemStatus from './SystemStatus'
const useStyles = makeStyles(styles)

const RightSide = () => {
  const classes = useStyles()

  const [rightSideState, setRightSide] = useState({
    alerts: {
      cardSize: 'default',
      buttonName: 'Show less'
    },
    systemStatus: {
      cardSize: 'default',
      buttonName: 'Show less'
    }
  })

  const setRightSideState = newState => {
    setRightSide(newState)
  }

  return (
    <>
      <Grid item xs={6}>
        <Grid item style={{ marginBottom: 16 }}>
          <div className={classes.card}>
            <Alerts
              cardState={rightSideState.alerts}
              setRightSideState={setRightSideState}
            />
          </div>
        </Grid>
        <Grid item>
          <div className={classes.card}>
            <SystemStatus
              cardState={rightSideState.systemStatus}
              setRightSideState={setRightSideState}
            />
          </div>
        </Grid>
      </Grid>
    </>
  )
}

export default RightSide
