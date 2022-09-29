import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { formatDistance } from 'date-fns'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { MainStatus } from 'src/components/Status'
import Title from 'src/components/Title'
import { HoverableTooltip } from 'src/components/Tooltip'
import { ActionButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Label1 } from 'src/components/typography'
import UpdateModal from 'src/pages/Maintenance/UpdateModal'
import { mainStyles } from 'src/pages/Transactions/Transactions.styles'
import { ReactComponent as DownloadInverseIcon } from 'src/styling/icons/button/download/white.svg'
import { ReactComponent as Download } from 'src/styling/icons/button/download/zodiac.svg'
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

const GET_MACHINES_UPDATE_STATUS = gql`
  query getMachinesUpdateStatus {
    getMachinesUpdateStatus {
      deviceId
      event
    }
  }
`

const GET_AVAILABLE_UPDATES = gql`
  query getAvailableUpdates {
    getAvailableUpdates {
      info
    }
  }
`

const useStyles = makeStyles(mainStyles)

const MachineStatus = () => {
  const classes = useStyles()
  const history = useHistory()
  const { state } = useLocation()

  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const addedMachineId = state?.id
  const {
    data: machinesResponse,
    refetch,
    loading: machinesLoading
  } = useQuery(GET_MACHINES)
  const { data: configResponse, configLoading } = useQuery(GET_DATA)
  const { data: machinesUpdateStatus } = useQuery(GET_MACHINES_UPDATE_STATUS)
  const { data: availableUpdates } = useQuery(GET_AVAILABLE_UPDATES)

  const timezone = R.path(['config', 'locale_timezone'], configResponse)
  const isMachineFunctional = m => R.head(m?.statuses).type !== 'error'
  const isMachineUpdating = m => {
    const status = R.find(R.propEq('deviceId', m?.deviceId))(
      machinesUpdateStatus?.getMachinesUpdateStatus ?? []
    )
    return !R.isNil(status) && (status.event !== 'successful' || 'error')
  }

  const handleClick = (m, event) => {
    event.stopPropagation()
    setShowUpdateModal(m.name)
  }

  const updateInfo = R.path(['getAvailableUpdates', 'info', 'package'])(
    availableUpdates
  )

  const updateButton = m => (
    <>
      <ActionButton
        disabled={!isMachineFunctional(m) || !updateInfo?.url}
        color="primary"
        Icon={Download}
        InverseIcon={DownloadInverseIcon}
        className={classes.update}
        onClick={event => handleClick(m, event)}>
        {!isMachineUpdating(m)
          ? `Update to v${updateInfo?.version}`
          : `Updating...`}
      </ActionButton>
    </>
  )

  const elements = [
    {
      header: 'Machine Name',
      width: 250,
      size: 'sm',
      textAlign: 'left',
      view: m => (
        <div className={classes.flexRow}>
          {m.name}
          <div
            className={classes.machineRedirectContainer}
            onClick={event => {
              event.stopPropagation()
              history.push(`/machines/${m.deviceId}`)
            }}>
            <MachineRedirectIcon />
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      width: 350,
      size: 'sm',
      textAlign: 'left',
      view: m => <MainStatus statuses={m.statuses} />
    },
    {
      header: 'Last ping',
      width: 200,
      size: 'sm',
      textAlign: 'left',
      view: m =>
        m.lastPing
          ? formatDistance(new Date(m.lastPing), new Date(), {
              addSuffix: true
            })
          : 'unknown'
    },
    {
      header: 'Software Version',
      width: 250,
      size: 'sm',
      textAlign: 'left',
      view: m => (
        <div className={classes.flexRow}>
          {m.version || 'unknown'}
          <>
            {!isMachineFunctional(m) ? (
              <HoverableTooltip
                id={m.name}
                arrowSize={3}
                placement="top"
                width={160}
                bgColor="tomato"
                className={classes.popperContent}
                parentElements={updateButton(m)}>
                <Label1 className={classes.popperText}>
                  {'Fix error status to update!'}
                </Label1>
              </HoverableTooltip>
            ) : (
              updateButton(m)
            )}
          </>
        </div>
      )
    }
  ]

  const machines = R.path(['machines'])(machinesResponse) ?? []
  const expandedIndex = R.findIndex(R.propEq('deviceId', addedMachineId))(
    machines
  )

  const InnerMachineDetailsRow = ({ it }) => (
    <MachineDetailsRow it={it} onActionSuccess={refetch} timezone={timezone} />
  )

  const loading = machinesLoading || configLoading

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
        loading={loading}
        elements={elements}
        data={machines}
        Details={InnerMachineDetailsRow}
        initialExpanded={expandedIndex}
        emptyText="No machines so far"
        expandable
      />
      <UpdateModal
        machines={machines}
        refetchData={GET_MACHINES_UPDATE_STATUS}
        updateInfo={updateInfo ?? {}}
        showModal={showUpdateModal}
        isMachineUpdating={isMachineUpdating}
        handleClose={() => setShowUpdateModal(false)}></UpdateModal>
    </>
  )
}

export default MachineStatus
