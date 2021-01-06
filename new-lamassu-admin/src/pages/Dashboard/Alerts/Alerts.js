import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'
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

const Alerts = ({ cardState, setRightSideState }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_ALERTS)
  const [showAllItems, setShowAllItems] = useState(false)

  const alerts = R.path(['alerts'])(data) ?? []
  const machines = R.compose(
    R.map(R.prop('name')),
    R.indexBy(R.prop('deviceId'))
  )(data?.machines ?? [])

  const showExpandButton = alerts.length > NUM_TO_RENDER && !showAllItems

  useEffect(() => {
    if (cardState.cardSize === 'small' || cardState.cardSize === 'default') {
      setShowAllItems(false)
    }
  }, [cardState.cardSize])

  const reset = () => {
    setRightSideState({
      systemStatus: { cardSize: 'default', buttonName: 'Show less' },
      alerts: { cardSize: 'default', buttonName: 'Show less' }
    })
    setShowAllItems(false)
  }

  const showAllClick = () => {
    setShowAllItems(true)
    setRightSideState({
      systemStatus: { cardSize: 'small', buttonName: 'Show machines' },
      alerts: { cardSize: 'big', buttonName: 'Show less' }
    })
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
        <H4 className={classes.h4}>{`Alerts ${
          data ? `(${alerts.length})` : 0
        }`}</H4>
        {(showAllItems || cardState.cardSize === 'small') && (
          <>
            <Label1
              style={{
                textAlign: 'center',
                marginBottom: 0,
                marginTop: 0
              }}>
              <Button
                onClick={reset}
                size="small"
                disableRipple
                disableFocusRipple
                className={classes.button}>
                {cardState.buttonName}
              </Button>
            </Label1>
          </>
        )}
      </div>
      {cardState.cardSize !== 'small' && (
        <>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <AlertsTable
                numToRender={showAllItems ? alerts.length : NUM_TO_RENDER}
                alerts={alerts}
                machines={machines}
              />
              {showExpandButton && (
                <>
                  <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
                    <Button
                      onClick={showAllClick}
                      size="small"
                      disableRipple
                      disableFocusRipple
                      className={classes.button}>
                      {`Show all (${alerts.length})`}
                    </Button>
                  </Label1>
                </>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}
export default Alerts
