import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useRef } from 'react'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import Uptime from 'src/components/Uptime'
import { Select } from 'src/components/inputs'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from 'src/components/table'
import { Info3, H4 } from 'src/components/typography'
import typographyStyles from 'src/components/typography/styles'
import { offColor } from 'src/styling/variables'
import { startCase } from 'src/utils/string'

import logsStyles from './Logs.styles'

const { p } = typographyStyles
const { tableWrapper } = logsStyles

const localStyles = {
  serverTableWrapper: {
    extend: tableWrapper,
    maxWidth: '100%',
    marginLeft: 0
  },
  serverVersion: {
    extend: p,
    color: offColor,
    margin: 'auto 0 auto 0'
  },
  headerLine2: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  uptimeContainer: {
    margin: 'auto 0 auto 0'
  }
}

const styles = R.merge(logsStyles, localStyles)

const useStyles = makeStyles(styles)

const SHOW_ALL = { code: 'SHOW_ALL', display: 'Show all' }

const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const NUM_LOG_RESULTS = 500

const GET_CSV = gql`
  query ServerData($limit: Int, $from: Date, $until: Date) {
    serverLogsCsv(limit: $limit, from: $from, until: $until)
  }
`

const GET_DATA = gql`
  query ServerData($limit: Int, $from: Date, $until: Date) {
    serverVersion
    uptime {
      name
      state
      uptime
    }
    serverLogs(limit: $limit, from: $from, until: $until) {
      logLevel
      id
      timestamp
      message
    }
  }
`

const Logs = () => {
  const classes = useStyles()

  const tableEl = useRef()

  const [saveMessage, setSaveMessage] = useState(null)
  const [logLevel, setLogLevel] = useState(SHOW_ALL)

  const { data, loading } = useQuery(GET_DATA, {
    onCompleted: () => setSaveMessage(''),
    variables: {
      limit: NUM_LOG_RESULTS
    }
  })

  const defaultLogLevels = [
    { code: 'error', display: 'Error' },
    { code: 'info', display: 'Info' },
    { code: 'debug', display: 'Debug' }
  ]
  const serverVersion = data?.serverVersion
  const processStates = data?.uptime ?? []

  const getLogLevels = R.compose(
    R.prepend(SHOW_ALL),
    R.uniq,
    R.concat(defaultLogLevels),
    R.map(it => ({
      code: R.path(['logLevel'])(it),
      display: startCase(R.path(['logLevel'])(it))
    })),
    R.path(['serverLogs'])
  )

  const handleLogLevelChange = logLevel => {
    if (tableEl.current) tableEl.current.scrollTo(0, 0)

    setLogLevel(logLevel)
  }

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Server</Title>
          {data && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name="server-logs"
                query={GET_CSV}
                logs={data.serverLogs}
                getLogs={logs => R.path(['serverLogsCsv'])(logs)}
              />
              <Info3>{saveMessage}</Info3>
            </div>
          )}
        </div>
        <div className={classes.serverVersion}>
          {serverVersion && <span>Server version: v{serverVersion}</span>}
        </div>
      </div>
      <div className={classes.headerLine2}>
        {data && (
          <Select
            onSelectedItemChange={handleLogLevelChange}
            label="Level"
            items={getLogLevels(data)}
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
        <div ref={tableEl} className={classes.serverTableWrapper}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow header>
                <TableHeader className={classes.dateColumn}>Date</TableHeader>
                <TableHeader className={classes.levelColumn}>Level</TableHeader>
                <TableHeader className={classes.fillColumn} />
              </TableRow>
            </TableHead>
            <TableBody>
              {data &&
                data.serverLogs
                  .filter(
                    log =>
                      logLevel === SHOW_ALL || log.logLevel === logLevel.code
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
          {loading && <H4>{'Loading...'}</H4>}
          {!loading && R.isEmpty(data?.serverLogs) && (
            <H4>{'No activity so far'}</H4>
          )}
        </div>
      </div>
    </>
  )
}

export default Logs
