import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import styles from './Dashboard.styles'
import SystemPerformance from './SystemPerformance'

const useStyles = makeStyles(styles)

const LeftSide = () => {
  const classes = useStyles()

  return (
    <Grid item xs={6}>
      <Grid item className={classes.leftSideMargin}>
        <div className={classes.card}>
          <SystemPerformance />
        </div>
      </Grid>
    </Grid>
  )
}

export default LeftSide
