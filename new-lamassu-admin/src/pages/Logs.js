import { makeStyles } from '@material-ui/core/styles'
import FileSaver from 'file-saver'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

import Sidebar from 'src/components/Sidebar'
import Title from 'src/components/Title'
import { SimpleButton } from 'src/components/buttons'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from 'src/components/table'
import { Info3 } from 'src/components/typography'

import styles from './Logs.styles.js'

const useStyles = makeStyles(styles)

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const GET_MACHINE_LOGS = gql`
  query MachineLogs($deviceId: ID!) {
    machineLogs(deviceId: $deviceId) {
      logLevel
      id
      timestamp
      message
    }
  }
`

const SUPPORT_LOGS = gql`
  mutation SupportLogs($deviceId: ID!) {
    machineSupportLogs(deviceId: $deviceId) {
      id
    }
  }
`

const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const formatDateFile = date => {
  return moment(date).format('YYYY-MM-DD_HH-mm')
}

const Logs = () => {
  const classes = useStyles()

  const [selected, setSelected] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)
  const deviceId = selected?.deviceId

  const { data: machineResponse } = useQuery(GET_MACHINES)

  const [saveSupportLogs, { loading }] = useMutation(SUPPORT_LOGS, {
    variables: { deviceId },
    onError: () => setSaveMessage('Failure saving snapshot'),
    onCompleted: () => setSaveMessage('✓ Saved latest snapshot')
  })

  const { data: logsResponse } = useQuery(GET_MACHINE_LOGS, {
    variables: { deviceId },
    fetchPolicy: 'no-cache',
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
        <Title>Machine Logs</Title>
        {logsResponse && (
          <div className={classes.buttonsWrapper}>
            <Info3>{saveMessage}</Info3>
            <SimpleButton
              className={classes.button}
              onClick={() => {
                const text = logsResponse.data.logs
                  .map(it => JSON.stringify(it))
                  .join('\n')
                const blob = new window.Blob([text], {
                  type: 'text/plain;charset=utf-8'
                })
                FileSaver.saveAs(
                  blob,
                  `${formatDateFile(new Date())}_${selected.name}`
                )
              }}>
              DL
            </SimpleButton>
            <SimpleButton
              className={classes.button}
              disabled={loading}
              onClick={saveSupportLogs}>
              Share with Lamassu
            </SimpleButton>
          </div>
        )}
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
