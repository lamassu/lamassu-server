import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import { gql } from 'apollo-boost'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import { FeatureButton, SimpleButton } from 'src/components/buttons'
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
import { ReactComponent as DownloadActive } from 'src/styling/icons/button/download/white.svg'
import { ReactComponent as Download } from 'src/styling/icons/button/download/zodiac.svg'

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

const Logs = () => {
  const classes = useStyles()

  const [selected, setSelected] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)

  const deviceId = selected?.deviceId

  const { data: machineResponse } = useQuery(GET_MACHINES)

  const [sendSnapshot, { loading }] = useMutation(SUPPORT_LOGS, {
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

  const handleOpenRangePicker = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'date-range-popover' : undefined

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine Logs</Title>
          {logsResponse && (
            <div className={classes.buttonsWrapper}>
              <FeatureButton
                Icon={Download}
                InverseIcon={DownloadActive}
                aria-describedby={id}
                variant="contained"
                onClick={handleOpenRangePicker}
              />
              <LogsDowloaderPopover
                title="Download logs"
                name="machine-logs"
                id={id}
                open={open}
                anchorEl={anchorEl}
                logs={logsResponse.machineLogs}
                getTimestamp={log => log.timestamp}
              />
              <SimpleButton
                className={classes.button}
                disabled={loading}
                onClick={sendSnapshot}>
                Share with Lamassu
              </SimpleButton>
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
