import { makeStyles } from '@material-ui/core'
import useAxios from '@use-hooks/axios'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'

import typographyStyles from 'src/components/typography/styles'
import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import Uptime from 'src/components/Uptime'
import { FeatureButton, SimpleButton } from 'src/components/buttons'
import { Select } from 'src/components/inputs'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from 'src/components/table'
import { Info3 } from 'src/components/typography'
import { ReactComponent as DownloadActive } from 'src/styling/icons/button/download/white.svg'
import { ReactComponent as Download } from 'src/styling/icons/button/download/zodiac.svg'
import { offColor } from 'src/styling/variables'

import logsStyles from './Logs.styles'

const { p } = typographyStyles
const { tableWrapper } = logsStyles

const localStyles = {
  serverTableWrapper: {
    extend: tableWrapper,
    maxWidth: '100%',
    marginLeft: 0,
  },
  serverVersion: {
    extend: p,
    color: offColor,
    margin: 'auto 0 auto 0',
  },
  headerLine2: {
    height: 60,
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  uptimeContainer: {
    margin: 'auto 0 auto 0',
  },
}

const styles = R.merge(logsStyles, localStyles)

const useStyles = makeStyles(styles)

const SHOW_ALL = 'Show all'

const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const Logs = () => {
  const [saveMessage, setSaveMessage] = useState(null)
  const [logLevel, setLogLevel] = useState(SHOW_ALL)
  const [version, setVersion] = useState(null)
  const [processStates, setProcessStates] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)

  const classes = useStyles()

  useAxios({
    url: 'https://localhost:8070/api/version',
    method: 'GET',
    options: {
      withCredentials: true,
    },
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setVersion(res.data)
      }
    },
  })

  useAxios({
    url: 'https://localhost:8070/api/uptimes',
    method: 'GET',
    options: {
      withCredentials: true,
    },
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setProcessStates(res.data)
      }
    },
  })

  const { response: logsResponse } = useAxios({
    url: 'https://localhost:8070/api/server_logs/',
    method: 'GET',
    options: {
      withCredentials: true,
    },
    trigger: [],
    customHandler: () => {
      setSaveMessage('')
    },
  })

  const { loading, reFetch: sendSnapshot } = useAxios({
    url: 'https://localhost:8070/api/server_support_logs',
    method: 'POST',
    options: {
      withCredentials: true,
    },
    customHandler: (err, res) => {
      if (err) {
        setSaveMessage('Failure saving snapshot')
        throw err
      }
      setSaveMessage('✓ Saved latest snapshot')
    },
  })

  const handleOpenRangePicker = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'date-range-popover' : undefined
  const getLogLevels = R.compose(
    R.prepend(SHOW_ALL),
    R.uniq,
    R.map(R.path(['logLevel'])),
    R.path(['data', 'logs']),
  )

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Server</Title>
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
                name="server-logs"
                id={id}
                open={open}
                anchorEl={anchorEl}
                logs={logsResponse.data.logs}
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
        <div className={classes.serverVersion}>
          {version && <span>Server version: v{version}</span>}
        </div>
      </div>
      <div className={classes.headerLine2}>
        {logsResponse && (
          <Select
            onSelectedItemChange={setLogLevel}
            label="Level"
            items={getLogLevels(logsResponse)}
            default={SHOW_ALL}
            selectedItem={logLevel}
          />
        )}
        <div className={classes.uptimeContainer}>
          {processStates &&
            processStates.map((process, idx) => (
              <Uptime key={idx} process={process} />
            ))}
        </div>
      </div>
      <div className={classes.wrapper}>
        <div className={classes.serverTableWrapper}>
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
                logsResponse.data.logs
                  .filter(
                    log => logLevel === SHOW_ALL || log.logLevel === logLevel,
                  )
                  .map((log, idx) => (
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
