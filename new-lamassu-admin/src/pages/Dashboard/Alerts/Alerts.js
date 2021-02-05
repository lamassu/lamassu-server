import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { cardState as cardState_ } from 'src/components/CollapsibleCard'
import { Label1, H4 } from 'src/components/typography'

import styles from '../Dashboard.styles'

import AlertsTable from './AlertsTable'

const NUM_TO_RENDER = 3

const GET_ALERTS = gql`
  query getAlerts {
    alerts {
      id
      type
      detail
      message
      created
      read
      valid
    }
    machines {
      deviceId
      name
    }
  }
`

const useStyles = makeStyles(styles)

const Alerts = ({ onReset, onExpand, size }) => {
  const classes = useStyles()
  const showAllItems = size === cardState_.EXPANDED
  const { data } = useQuery(GET_ALERTS)
  const alerts = R.path(['alerts'])(data) ?? []
  const machines = R.compose(
    R.map(R.prop('name')),
    R.indexBy(R.prop('deviceId'))
  )(data?.machines ?? [])
  const alertsLength = alerts.length

  return (
    <>
      <div className={classes.container}>
        <H4 className={classes.h4}>{`Alerts (${alertsLength})`}</H4>
        {showAllItems && (
          <Label1 className={classes.upperButtonLabel}>
            <Button
              onClick={onReset}
              size="small"
              disableRipple
              disableFocusRipple
              className={classes.button}>
              {'Show less'}
            </Button>
          </Label1>
        )}
      </div>
      <Grid container spacing={1}>
        <Grid item xs={12} className={classes.alertsTableMargin}>
          <AlertsTable
            numToRender={showAllItems ? alerts.length : NUM_TO_RENDER}
            alerts={alerts}
            machines={machines}
          />
          {!showAllItems && alertsLength > NUM_TO_RENDER && (
            <Label1 className={classes.centerLabel}>
              <Button
                onClick={() => onExpand('alerts')}
                size="small"
                disableRipple
                disableFocusRipple
                className={classes.button}>
                {`Show all (${alerts.length})`}
              </Button>
            </Label1>
          )}
        </Grid>
      </Grid>
    </>
  )
}
export default Alerts
