import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import ActionButton from 'src/components/buttons/ActionButton'
import { H4, TL2, Label1 } from 'src/components/typography'

import styles from '../Dashboard.styles'
const useStyles = makeStyles(styles)
const SystemStatus = () => {
  const classes = useStyles()
  return (
    <>
      <H4>System status</H4>
      <Grid container spacing={1}>
        <Grid item xs={5}>
          <TL2 style={{ display: 'inline' }}>152d 11h 32m</TL2>
          <Label1 style={{ display: 'inline' }}> System up time</Label1>
        </Grid>
        <Grid item xs={4}>
          <TL2 style={{ display: 'inline' }}>v10.5.1</TL2>
          <Label1 style={{ display: 'inline' }}> server version</Label1>
        </Grid>
        <Grid item xs={3}>
          <ActionButton
            color="primary"
            className={classes.actionButton}
            onClick={() => console.log('Upgrade button clicked')}>
            Update to v10.6.0
          </ActionButton>
        </Grid>
      </Grid>
    </>
  )
}

export default SystemStatus
