import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import Sidebar from 'src/components/layout/Sidebar'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from 'src/components/table'
import { Info3 } from 'src/components/typography'

import styles from './Logs.styles'

const useStyles = makeStyles(styles)

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const NUM_LOG_RESULTS = 500

const GET_MACHINE_LOGS_CSV = gql`
  query MachineLogs(
    $deviceId: ID!
    $limit: Int
    $from: DateTime
    $until: DateTime
  ) {
    machineLogsCsv(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
    )
  }
`

const GET_MACHINE_LOGS = gql`
  query MachineLogs(
    $deviceId: ID!
    $limit: Int
    $from: DateTime
    $until: DateTime
  ) {
    machineLogs(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
    ) {
      logLevel
      id
      timestamp
      message
    }
  }
`

const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const Logs = () => {
  const classes = useStyles()

  const [selected, setSelected] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)

  const deviceId = selected?.deviceId

  const { data: machineResponse } = useQuery(GET_MACHINES)

  const { data: logsResponse } = useQuery(GET_MACHINE_LOGS, {
    variables: { deviceId, limit: NUM_LOG_RESULTS },
    skip: !selected,
    onCompleted: () => setSaveMessage('')
  })

  if (machineResponse?.machines?.length && !selected) {
    setSelected(machineResponse?.machines[0])
  }

  const isSelected = it => {
    return R.path(['deviceId'])(selected) === it.deviceId
  }

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine Logs</Title>
          {logsResponse && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name="machine-logs"
                query={GET_MACHINE_LOGS_CSV}
                args={{ deviceId }}
                getLogs={logs => R.path(['machineLogsCsv'])(logs)}
              />
              <Info3>{saveMessage}</Info3>
            </div>
          )}
        </div>
      </div>
      <div className={classes.wrapper}>
        <Sidebar
          displayName={it => it.name}
          data={machineResponse?.machines || []}
          isSelected={isSelected}
          onClick={setSelected}
        />
        <div className={classes.tableWrapper}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow header>
                <TableHeader className={classes.dateColumn}>Date</TableHeader>
                <TableHeader className={classes.levelColumn}>Level</TableHeader>
                <TableHeader className={classes.fillColumn} />
              </TableRow>
            </TableHead>
            <TableBody>
              {logsResponse &&
                logsResponse.machineLogs.map((log, idx) => (
                  <TableRow key={idx} size="sm">
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.logLevel}</TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default Logs
