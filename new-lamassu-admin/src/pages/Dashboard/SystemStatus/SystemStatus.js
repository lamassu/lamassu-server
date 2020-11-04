import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import ActionButton from 'src/components/buttons/ActionButton'
import { H4, TL2, Label1 } from 'src/components/typography'

import styles from '../Dashboard.styles'

import MachinesTable from './MachinesTable'

const useStyles = makeStyles(styles)

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

const SystemStatus = ({ buttonNames, resizeAlerts }) => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_DATA)
  const [showAllItems, setShowAllItems] = useState(false)

  const handleExpandTable = type => {
    switch (type) {
      case 'expand':
        setShowAllItems(true)
        resizeAlerts('shrink')
        break
      case 'shrink':
        setShowAllItems(false)
        resizeAlerts('expand')
        break
      default:
        break
    }
  }

  // placeholder data
  if (data) {
    data.uptime = [{ time: 1854125, state: 'RUNNING' }]
  }

  const uptime = data?.uptime ?? [{}]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <H4>System status</H4>
        {showAllItems && (
          <>
            <Label1 style={{ textAlign: 'center', marginBottom: 0 }}>
              <Button
                onClick={() => handleExpandTable('shrink')}
                size="small"
                disableRipple
                disableFocusRipple
                className={classes.button}>
                {buttonNames.systemStatus}
              </Button>
            </Label1>
          </>
        )}
      </div>
      {!loading && (
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
                handleExpandTable={handleExpandTable}
                showAllItems={showAllItems}
                machines={data?.machines ?? []}
              />
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default SystemStatus
