import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState, useEffect } from 'react'

import ActionButton from 'src/components/buttons/ActionButton'
import { H4, TL2, Label1 } from 'src/components/typography'

import MachinesTable from './MachinesTable'
import styles from './MachinesTable.styles'

const useStyles = makeStyles(styles)

// number of machines in the table to render on page load
const NUM_TO_RENDER = 1

const GET_DATA = gql`
  query getData {
    machines {
      name
      deviceId
      cashbox
      cassette1
      cassette2
      statuses {
        label
        type
      }
    }
    serverVersion
    uptime {
      name
      state
      uptime
    }
  }
`

const parseUptime = time => {
  if (time < 60) return `${time}s`
  if (time < 3600) return `${Math.floor(time / 60)}m`
  if (time < 86400) return `${Math.floor(time / 60 / 60)}h`
  return `${Math.floor(time / 60 / 60 / 24)}d`
}

const SystemStatus = ({ cardState, setRightSideState }) => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_DATA)
  const [showAllItems, setShowAllItems] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [numToRender, setNumToRender] = useState(NUM_TO_RENDER)

  if (!loading && data.machines.length < 20) {
    data.machines = [...data.machines, ...data.machines]
  }

  useEffect(() => {
    if (showAllItems) {
      setShowExpandButton(false)
      setNumToRender(data?.machines.length)
    } else if (data && data?.machines.length > numToRender) {
      setShowExpandButton(true)
    }
    if (cardState.cardSize === 'small' || cardState.cardSize === 'default') {
      setShowAllItems(false)
      setNumToRender(NUM_TO_RENDER)
    }
  }, [cardState.cardSize, data, numToRender, showAllItems])

  const reset = () => {
    setShowAllItems(false)
    setNumToRender(NUM_TO_RENDER)
    setRightSideState({
      systemStatus: { cardSize: 'default', buttonName: 'Show less' },
      alerts: { cardSize: 'default', buttonName: 'Show less' }
    })
  }

  const showAllClick = () => {
    setShowExpandButton(false)
    setShowAllItems(true)
    setRightSideState({
      systemStatus: { cardSize: 'big', buttonName: 'Show less' },
      alerts: { cardSize: 'small', buttonName: 'Show alerts' }
    })
  }

  // placeholder data
  if (data) {
    data.uptime = [{ time: 1854125, state: 'RUNNING' }]
  }

  const uptime = data?.uptime ?? [{}]
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <H4 className={classes.h4}>System status</H4>
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
      {!loading && cardState.cardSize !== 'small' && (
        <>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <TL2 style={{ display: 'inline' }}>
                {parseUptime(uptime[0].time)}
              </TL2>
              <Label1 style={{ display: 'inline' }}> System up time</Label1>
            </Grid>
            <Grid item xs={4}>
              <TL2 style={{ display: 'inline' }}>{data?.serverVersion}</TL2>
              <Label1 style={{ display: 'inline' }}> server version</Label1>
            </Grid>
            <Grid item xs={4}>
              <ActionButton
                color="primary"
                className={classes.actionButton}
                onClick={() => console.log('Upgrade button clicked')}>
                Update to v10.6.0
              </ActionButton>
            </Grid>
          </Grid>
          <Grid container spacing={1} style={{ marginTop: 23 }}>
            <Grid item xs={12}>
              <MachinesTable
                numToRender={numToRender}
                machines={data?.machines ?? []}
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
                      {`Show all (${data.machines.length})`}
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

export default SystemStatus
