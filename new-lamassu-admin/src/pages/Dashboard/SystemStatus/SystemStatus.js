import { useQuery } from '@apollo/react-hooks'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { cardState as cardState_ } from 'src/components/CollapsibleCard'
// import ActionButton from 'src/components/buttons/ActionButton'
import { H4, TL2, Label1 } from 'src/components/typography'

import MachinesTable from './MachinesTable'
import styles from './MachinesTable.styles'

const useStyles = makeStyles(styles)

// number of machines in the table to render on page load
const NUM_TO_RENDER = 4

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

/* const parseUptime = time => {
  if (time < 60) return `${time}s`
  if (time < 3600) return `${Math.floor(time / 60)}m`
  if (time < 86400) return `${Math.floor(time / 60 / 60)}h`
  return `${Math.floor(time / 60 / 60 / 24)}d`
} */

const SystemStatus = ({ onReset, onExpand, size }) => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_DATA)

  const machines = R.path(['machines'])(data) ?? []
  const showAllItems = size === cardState_.EXPANDED

  const machinesTableContainerClasses = {
    [classes.machinesTableContainer]: !showAllItems,
    [classes.expandedMachinesTableContainer]: showAllItems
  }
  // const uptime = data?.uptime ?? [{}]
  return (
    <>
      <div className={classes.container}>
        <H4 className={classes.h4}>System status</H4>{' '}
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
      {!loading && (
        <>
          <Grid container spacing={1}>
            {/*             
            On hold until system uptime is implemented
            <Grid item xs={4}>
              <TL2 className={classes.tl2}>
                {parseUptime(uptime[0].time)}
              </TL2>
              <Label1 className={classes.label1}> System up time</Label1>
            </Grid> */}
            <Grid item xs={4}>
              <TL2 className={classes.tl2}>{data?.serverVersion}</TL2>
              <Label1 className={classes.label1}> server version</Label1>
            </Grid>
            <Grid item xs={4}>
              {/*
              On hold until system update features are implemented
              <ActionButton
                color="primary"
                className={classes.actionButton}
                onClick={() => console.log('Upgrade button clicked')}>
                Update to v10.6.0
              </ActionButton> */}
            </Grid>
          </Grid>
          <Grid
            container
            spacing={1}
            className={classnames(machinesTableContainerClasses)}>
            <Grid item xs={12}>
              <MachinesTable
                numToRender={showAllItems ? Infinity : NUM_TO_RENDER}
                machines={machines}
              />
            </Grid>
          </Grid>
          {!showAllItems && machines.length > NUM_TO_RENDER && (
            <Grid item xs={12}>
              <Label1 className={classes.centerLabel}>
                <Button
                  onClick={() => onExpand()}
                  size="small"
                  disableRipple
                  disableFocusRipple
                  className={classes.button}>
                  {`Show all (${machines.length})`}
                </Button>
              </Label1>
            </Grid>
          )}
        </>
      )}
    </>
  )
}

export default SystemStatus
