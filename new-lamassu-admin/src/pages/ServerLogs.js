import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useRef } from 'react'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import Uptime from 'src/components/Uptime'
import { SimpleButton } from 'src/components/buttons'
import { Select } from 'src/components/inputs'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from 'src/components/table'
import { Label1, Info3 } from 'src/components/typography'
import typographyStyles from 'src/components/typography/styles'
import { ReactComponent as WhiteShareIcon } from 'src/styling/icons/circle buttons/share/white.svg'
import { ReactComponent as ShareIcon } from 'src/styling/icons/circle buttons/share/zodiac.svg'
import { offColor } from 'src/styling/variables'

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

const SHOW_ALL = 'Show all'

const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm')
}

const NUM_LOG_RESULTS = 500

const GET_DATA = gql`
  query ServerData($limit: Int) {
    serverVersion
    uptime {
      name
      state
      uptime
    }
    serverLogs(limit: $limit) {
      logLevel
      id
      timestamp
      message
    }
  }
`
const SUPPORT_LOGS = gql`
  mutation ServerSupportLogs {
    serverSupportLogs {
      id
    }
  }
`

const Logs = () => {
  const classes = useStyles()

  const tableEl = useRef()

  const [saveMessage, setSaveMessage] = useState(null)
  const [logLevel, setLogLevel] = useState(SHOW_ALL)

  const { data } = useQuery(GET_DATA, {
    onCompleted: () => setSaveMessage(''),
    variables: {
      limit: NUM_LOG_RESULTS
    }
  })

  const serverVersion = data?.serverVersion
  const processStates = data?.uptime ?? []

  const [sendSnapshot, { loading }] = useMutation(SUPPORT_LOGS, {
    onError: () => setSaveMessage('Failure saving snapshot'),
    onCompleted: () => setSaveMessage('✓ Saved latest snapshot')
  })

  const getLogLevels = R.compose(
    R.prepend(SHOW_ALL),
    R.uniq,
    R.concat(['error', 'info', 'debug']),
    R.map(R.path(['logLevel'])),
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
                logs={data.serverLogs}
                getTimestamp={log => log.timestamp}
              />
              <SimpleButton
                className={classes.shareButton}
                disabled={loading}
                Icon={ShareIcon}
                InverseIcon={WhiteShareIcon}
                onClick={sendSnapshot}>
                <Label1>Share with Lamassu</Label1>
              </SimpleButton>
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
                    log => logLevel === SHOW_ALL || log.logLevel === logLevel
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
