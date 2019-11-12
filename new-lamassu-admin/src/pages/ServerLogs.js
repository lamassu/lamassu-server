import React, { useState } from 'react'
import FileSaver from 'file-saver'
import { concat, uniq } from 'lodash/fp'
import moment from 'moment'
import useAxios from '@use-hooks/axios'

import Title from '../components/Title'
import { Info3 } from '../components/typography'
import { FeatureButton, SimpleButton } from '../components/buttons'
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../components/table'
import { Select } from '../components/inputs'
import Uptime from '../components/Uptime'
import { ReactComponent as Download } from '../styling/icons/button/download/zodiac.svg'
import { ReactComponent as DownloadActive } from '../styling/icons/button/download/white.svg'

import { makeStyles } from '@material-ui/core'
import typographyStyles from '../components/typography/styles'

import { comet } from '../styling/variables'
import styles from './Logs.styles'
import logPageHeaderStyles from './LogPageHeader.styles'

const { regularLabel } = typographyStyles
const { tableWrapper } = styles
const { titleAndButtonsContainer, buttonsWrapper } = logPageHeaderStyles

styles.titleWrapper = {
  display: 'flex',
  justifyContent: 'space-between'
}

styles.serverTableWrapper = {
  extend: tableWrapper,
  maxWidth: '100%',
  marginLeft: 0
}

styles.serverVersion = {
  extend: regularLabel,
  color: comet,
  margin: 'auto 0 auto 0'
}

styles.headerLine2 = {
  height: 60,
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 24
}

styles.uptimeContainer = {
  margin: 'auto 0 auto 0'
}

styles.titleAndButtonsContainer = titleAndButtonsContainer
styles.buttonsWrapper = buttonsWrapper

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

  const classes = useStyles()

  useAxios({
    url: 'http://localhost:8070/api/version',
    method: 'GET',
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setVersion(res.data)
      }
    }
  })

  useAxios({
    url: 'http://localhost:8070/api/uptimes',
    method: 'GET',
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setProcessStates(res.data)
      }
    }
  })

  const { response: logsResponse } = useAxios({
    url: 'http://localhost:8070/api/server_logs/',
    method: 'GET',
    trigger: [],
    customHandler: () => {
      setSaveMessage('')
    }
  })

  const { loading, reFetch: sendSnapshot } = useAxios({
    url: 'http://localhost:8070/api/server_support_logs',
    method: 'POST',
    customHandler: (err, res) => {
      if (err) {
        setSaveMessage('Failure saving snapshot')
        throw err
      }
      setSaveMessage('✓ Saved latest snapshot')
    }
  })

  const handleLogLevelChange = (item) => setLogLevel(item)

  const formatDateFile = date => {
    return moment(date).format('YYYY-MM-DD_HH-mm')
  }

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
                onClick={() => {
                  const text = logsResponse.data.logs.map(it => JSON.stringify(it)).join('\n')
                  const blob = new window.Blob([text], {
                    type: 'text/plain;charset=utf-8'
                  })
                  FileSaver.saveAs(blob, `${formatDateFile(new Date())}_server`)
                }}
              />
              <SimpleButton className={classes.button} disabled={loading} onClick={sendSnapshot}>
                Share with Lamassu
              </SimpleButton>
              <Info3>{saveMessage}</Info3>
            </div>
          )}
        </div>
        <div className={classes.serverVersion}>
          {version && (
            <span>Server version: v{version}</span>
          )}
        </div>
      </div>
      <div className={classes.headerLine2}>
        {logsResponse && (
          <Select
            onSelectedItemChange={handleLogLevelChange}
            label='Level'
            items={concat([SHOW_ALL], uniq(logsResponse.data.logs.map(log => log.logLevel)))}
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
                logsResponse.data.logs.filter(log => logLevel === SHOW_ALL || log.logLevel === logLevel).map((log, idx) => (
                  <TableRow key={idx} size='sm'>
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
