import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { cardState } from 'src/components/CollapsibleCard'
import { Label1, H4 } from 'src/components/typography'

import styles from './Alerts.styles'
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
  const showAllItems = size === cardState.EXPANDED
  const { data } = useQuery(GET_ALERTS)
  const alerts = R.path(['alerts'])(data) ?? []
  const machines = R.compose(
    R.map(R.prop('name')),
    R.indexBy(R.prop('deviceId'))
  )(data?.machines ?? [])
  const alertsLength = alerts.length

  const alertsTableContainerClasses = {
    [classes.alertsTableContainer]: !showAllItems,
    [classes.expandedAlertsTableContainer]: showAllItems
  }

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
      <Grid
        className={classnames(alertsTableContainerClasses)}
        container
        spacing={1}>
        <Grid item xs={12}>
          {!alerts.length && (
            <Label1 className={classes.noAlertsLabel}>
              No new alerts. Your system is running smoothly.
            </Label1>
          )}
          <AlertsTable
            numToRender={showAllItems ? alerts.length : NUM_TO_RENDER}
            alerts={alerts}
            machines={machines}
          />
        </Grid>
      </Grid>
      {!showAllItems && alertsLength > NUM_TO_RENDER && (
        <Grid item xs={12}>
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
        </Grid>
      )}
    </>
  )
}
export default Alerts
