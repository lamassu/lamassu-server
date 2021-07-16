import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { MainStatus } from 'src/components/Status'
import Title from 'src/components/Title'
import DataTable from 'src/components/tables/DataTable'
import { mainStyles } from 'src/pages/Transactions/Transactions.styles'
import { ReactComponent as MachineRedirectIcon } from 'src/styling/icons/month arrows/right.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/status/pumpkin.svg'
import { ReactComponent as ErrorIcon } from 'src/styling/icons/status/tomato.svg'

import MachineDetailsRow from './MachineDetailsCard'

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
      lastPing
      pairedAt
      version
      paired
      cashbox
      cassette1
      cassette2
      version
      model
      statuses {
        label
        type
      }
      downloadSpeed
      responseTime
      packetLoss
    }
  }
`

const GET_DATA = gql`
  query getData {
    config
  }
`

const useStyles = makeStyles(mainStyles)

const MachineStatus = () => {
  const classes = useStyles()
  const history = useHistory()
  const { state } = useLocation()
  const addedMachineId = state?.id
  const { data: machinesResponse, refetch, loading } = useQuery(GET_MACHINES)
  const { data: configResponse, configLoading } = useQuery(GET_DATA)
  const timezone = R.path(['config', 'locale_timezone'], configResponse)

  const elements = [
    {
      header: 'Machine Name',
      width: 150,
      size: 'sm',
      textAlign: 'left',
      view: m => (
        <div className={classes.flexRow}>
          {m.name}
          <div
            className={classes.machineRedirectContainer}
            onClick={() => {
              history.push(`/machines/${m.deviceId}`)
            }}>
            <MachineRedirectIcon />
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      width: 150,
      size: 'sm',
      textAlign: 'left',
      view: m => <MainStatus statuses={m.statuses} />
    },
    {
      header: 'Last ping',
      width: 175,
      size: 'sm',
      textAlign: 'left',
      view: m => (m.lastPing ? moment(m.lastPing).fromNow() : 'unknown')
    },
    {
      header: 'Network speed',
      width: 150,
      size: 'sm',
      textAlign: 'left',
      view: m =>
        m.downloadSpeed
          ? new BigNumber(m.downloadSpeed).toFixed(4).toString() + '  MB/s'
          : 'unavailable'
    },
    {
      header: 'Latency',
      width: 150,
      size: 'sm',
      textAlign: 'left',
      view: m =>
        m.responseTime
          ? new BigNumber(m.responseTime).toFixed(3).toString() + '  ms'
          : 'unavailable'
    },
    {
      header: 'Loss',
      width: 125,
      size: 'sm',
      textAlign: 'left',
      view: m =>
        m.packetLoss
          ? new BigNumber(m.packetLoss).toFixed(3).toString() + '  %'
          : 'unavailable'
    },
    {
      header: 'Software Version',
      width: 200,
      size: 'sm',
      textAlign: 'left',
      view: m => m.version || 'unknown'
    }
  ]

  const machines = R.path(['machines'])(machinesResponse) ?? []
  const expandedIndex = R.findIndex(R.propEq('deviceId', addedMachineId))(
    machines
  )

  const InnerMachineDetailsRow = ({ it }) => (
    <MachineDetailsRow it={it} onActionSuccess={refetch} timezone={timezone} />
  )

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine Status</Title>
        </div>
        <div className={classes.headerLabels}>
          <div>
            <WarningIcon />
            <span>Warning</span>
          </div>
          <div>
            <ErrorIcon />
            <span>Error</span>
          </div>
        </div>
      </div>
      <DataTable
        loading={loading && configLoading}
        elements={elements}
        data={machines}
        Details={InnerMachineDetailsRow}
        initialExpanded={expandedIndex}
        emptyText="No machines so far"
        expandable
      />
    </>
  )
}

export default MachineStatus
