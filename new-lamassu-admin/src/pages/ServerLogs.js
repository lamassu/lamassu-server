import React, { useState } from 'react'
import FileSaver from 'file-saver'
import classnames from 'classnames'
import { concat, uniq, toInteger } from 'lodash/fp'
import moment from 'moment'
import useAxios from '@use-hooks/axios'
import { makeStyles } from '@material-ui/core'

import Title from '../components/Title'
import { Info3 } from '../components/typography'
import { FeatureButton, SimpleButton, Link } from '../components/buttons'
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../components/table'
import { Select, RadioGroup } from '../components/inputs'
import Uptime from '../components/Uptime'
import DateRangePicker from '../components/date-range-picker/DateRangePicker'
import Popover from '../components/Popover'
import { ReactComponent as Download } from '../styling/icons/button/download/zodiac.svg'
import { ReactComponent as DownloadActive } from '../styling/icons/button/download/white.svg'

import { primaryColor, comet } from '../styling/variables'
import styles from './Logs.styles'
import logPageHeaderStyles from './LogPageHeader.styles'

import typographyStyles from '../components/typography/styles'
const { regularLabel, h4 } = typographyStyles
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

styles.popoverContent = {
  minWidth: 315
}

styles.popoverHeader = {
  extend: h4,
  padding: [[20, 15, 0, 15]]
}

styles.radioButtonsContainer = {
  padding: [[10, 15, 10, 15]]
}

styles.radioButtons = {
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'row',
  color: primaryColor
}

styles.dateRangePickerShowing = {
  display: 'block',
  height: '100%'
}

styles.dateRangePickerHidden = {
  display: 'none',
  height: 0
}

styles.download = {
  padding: [[30, 15, 30, 15]]
}

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
  const [radioButtons, setRadioButtons] = useState(0)
  const [range, setRange] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)

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

  const formatDateFile = date => {
    return moment(date).format('YYYY-MM-DD_HH-mm')
  }

  const dateRangePickerClasses = {
    [classes.dateRangePickerShowing]: radioButtons === 1,
    [classes.dateRangePickerHidden]: radioButtons === 0
  }

  const handleOpenRangePicker = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseRangePicker = () => {
    setAnchorEl(null)
  }

  const handleRadioButtons = (event) => {
    setRadioButtons(toInteger(event.target.value))
  }

  const handleRangeChange = (from, to) => {
    setRange({ from, to })
  }

  const open = Boolean(anchorEl)
  const id = open ? 'date-range-popover' : undefined

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
                variant='contained'
                onClick={handleOpenRangePicker}
              />
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseRangePicker}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center'
                }}
              >
                <div className={classes.popoverContent}>
                  <div className={classes.popoverHeader}>
                    Download logs
                  </div>
                  <div className={classes.radioButtonsContainer}>
                    <RadioGroup
                      name='logs-select'
                      value={radioButtons}
                      labels={['All logs', 'Date range']}
                      ariaLabel='logs-select'
                      onChange={handleRadioButtons}
                      className={classes.radioButtons}
                    />
                  </div>
                  <DateRangePicker
                    maxDate={moment()}
                    handleChange={handleRangeChange}
                    className={classnames(dateRangePickerClasses)}
                  />
                  <div className={classes.download}>
                    <Link
                      color='primary'
                      onClick={() => {
                        if (radioButtons === 0) {
                          const text = logsResponse.data.logs.map(it => JSON.stringify(it)).join('\n')
                          const blob = new window.Blob([text], {
                            type: 'text/plain;charset=utf-8'
                          })
                          FileSaver.saveAs(blob, `${formatDateFile(new Date())}_server`)
                        } else if (radioButtons === 1 && range.from && range.to) {
                          const text = logsResponse.data.logs.filter((log) => moment(log.timestamp).isBetween(range.from, range.to, 'day', '[]')).map(it => JSON.stringify(it)).join('\n')
                          const blob = new window.Blob([text], {
                            type: 'text/plain;charset=utf-8'
                          })
                          FileSaver.saveAs(blob, `${formatDateFile(range.from)}_${formatDateFile(range.to)}_server`)
                        }
                      }}
                    >
                      Download
                    </Link>
                  </div>
                </div>
              </Popover>
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
            onSelectedItemChange={setLogLevel}
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
