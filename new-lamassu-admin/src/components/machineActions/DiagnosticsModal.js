import { useLazyQuery, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { subMinutes } from 'date-fns'
import FileSaver from 'file-saver'
import gql from 'graphql-tag'
import React, { useState, useEffect } from 'react'

import Modal from 'src/components/Modal'
import { Button } from 'src/components/buttons'
import { H3, P } from 'src/components/typography'
import { URI } from 'src/utils/apollo'

import { diagnosticsModal } from './MachineActions.styles'

const useStyles = makeStyles(diagnosticsModal)

const STATES = {
  INITIAL: 'INITIAL',
  EMPTY: 'EMPTY',
  RUNNING: 'RUNNING',
  FAILURE: 'FAILURE',
  FILLED: 'FILLED'
}

const MACHINE = gql`
  query getMachine($deviceId: ID!) {
    machine(deviceId: $deviceId) {
      diagnostics {
        timestamp
        frontTimestamp
        scanTimestamp
      }
    }
  }
`

const MACHINE_LOGS = gql`
  query machineLogsCsv(
    $deviceId: ID!
    $limit: Int
    $from: Date
    $until: Date
    $timezone: String
  ) {
    machineLogsCsv(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
    )
  }
`

const createCsv = async ({ machineLogsCsv }) => {
  console.log(machineLogsCsv)
  const machineLogs = new Blob([machineLogsCsv], {
    type: 'text/plain;charset=utf-8'
  })

  FileSaver.saveAs(machineLogs, 'machineLogs.csv')
}

const DiagnosticsModal = ({ onClose, deviceId, sendAction }) => {
  const classes = useStyles()
  const [state, setState] = useState(STATES.INITIAL)
  const [timestamp, setTimestamp] = useState(null)
  let timeout = null

  const [fetchSummary, { loading }] = useLazyQuery(MACHINE_LOGS, {
    onCompleted: data => createCsv(data)
  })

  const { data, stopPolling, startPolling } = useQuery(MACHINE, {
    variables: { deviceId }
  })

  useEffect(() => {
    if (!data) return
    if (!timestamp && !data.machine.diagnostics.timestamp) {
      stopPolling()
      setState(STATES.EMPTY)
    }
    if (
      data.machine.diagnostics.timestamp &&
      data.machine.diagnostics.timestamp !== timestamp
    ) {
      clearTimeout(timeout)
      setTimestamp(data.machine.diagnostics.timestamp)
      setState(STATES.FILLED)
      stopPolling()
    }
  }, [data, stopPolling, timeout, timestamp])

  const path = `${URI}/operator-data/diagnostics/${deviceId}/`

  function runDiagnostics() {
    startPolling(2000)

    timeout = setTimeout(() => {
      setState(STATES.FAILURE)
      stopPolling()
    }, 60 * 1000)

    setState(STATES.RUNNING)
    sendAction()
  }

  return (
    <Modal
      closeOnBackdropClick={true}
      width={800}
      height={600}
      handleClose={onClose}
      open={true}>
      {state === STATES.INITIAL && (
        <div className={classes.message}>
          <H3>Loading...</H3>
        </div>
      )}

      {state === STATES.EMPTY && (
        <div className={classes.message}>
          <H3>No diagnostics available</H3>
          <P>Run diagnostics to generate a report</P>
        </div>
      )}

      {state === STATES.RUNNING && (
        <div className={classes.message}>
          <H3>Running Diagnostics...</H3>
          <P>This page should refresh automatically</P>
        </div>
      )}

      {state === STATES.FAILURE && (
        <div className={classes.message}>
          <H3>Failed to run diagnostics</H3>
          <P>Please try again. If the problem persists, contact support.</P>
        </div>
      )}

      {state === STATES.FILLED && (
        <div>
          <div className={classes.photoWrapper}>
            <div>
              <H3>Scan</H3>
              <img
                className={classes.photo}
                src={path + 'scan.jpg'}
                alt="Failure getting photo"
              />
            </div>
            <div>
              <H3>Front</H3>
              <img
                className={classes.photo}
                src={path + 'front.jpg'}
                alt="Failure getting photo"
              />
              <P></P>
            </div>
          </div>
          <div>
            <P>Diagnostics executed at: {timestamp}</P>
          </div>
        </div>
      )}
      <div className={classes.footer}>
        <Button
          disabled={state !== STATES.FILLED || !timestamp}
          onClick={() => {
            if (loading) return
            fetchSummary({
              variables: {
                from: subMinutes(new Date(timestamp), 5),
                deviceId,
                limit: 500
              }
            })
          }}
          className={classes.downloadLogs}>
          Download Logs
        </Button>
        <Button
          disabled={state === STATES.RUNNING}
          onClick={() => {
            runDiagnostics()
          }}>
          Run Diagnostics
        </Button>
      </div>
    </Modal>
  )
}

export default DiagnosticsModal
