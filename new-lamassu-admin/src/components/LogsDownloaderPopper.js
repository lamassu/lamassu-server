import { useLazyQuery } from '@apollo/react-hooks'
import { makeStyles, ClickAwayListener } from '@material-ui/core'
import classnames from 'classnames'
import FileSaver from 'file-saver'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useCallback } from 'react'

import { FeatureButton, Link } from 'src/components/buttons'
import { ReactComponent as Arrow } from 'src/styling/icons/arrow/download_logs.svg'
import { ReactComponent as DownloadInverseIcon } from 'src/styling/icons/button/download/white.svg'
import { ReactComponent as Download } from 'src/styling/icons/button/download/zodiac.svg'
import { primaryColor, offColor, zircon } from 'src/styling/variables'

import Popper from './Popper'
import DateRangePicker from './date-range-picker/DateRangePicker'
import { RadioGroup } from './inputs'
import typographyStyles from './typography/styles'

const { info1, label1, label2, h4 } = typographyStyles

const dateContainerStyles = {
  wrapper: {
    height: 46,
    width: 99
  },
  container: {
    display: 'flex'
  },
  monthWeekDayContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    extend: label1,
    lineHeight: 1.33,
    color: primaryColor
  },
  bigNumber: {
    extend: info1,
    lineHeight: 1,
    marginRight: 7
  },
  monthYear: {
    extend: label2,
    lineHeight: 1.17,
    color: primaryColor
  },
  weekDay: {
    extend: label1,
    lineHeight: 1.33,
    color: offColor
  }
}

const dateContainerUseStyles = makeStyles(dateContainerStyles)

const DateContainer = ({ date, children, ...props }) => {
  const classes = dateContainerUseStyles()

  return (
    <div className={classes.wrapper}>
      <div className={classes.label}>{children}</div>
      {date && (
        <>
          <div className={classes.container}>
            <div className={classes.bigNumber}>{date.format('D')}</div>
            <div className={classes.monthWeekDayContainer}>
              <span className={classes.monthYear}>{`${date.format(
                'MMM'
              )} ${date.format('YYYY')}`}</span>
              <span className={classes.weekDay}>{date.format('dddd')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  popoverContent: {
    width: 280
  },
  popoverHeader: {
    extend: h4,
    padding: [[15, 15, 0, 15]]
  },
  radioButtonsContainer: {
    padding: [[5, 15, 5, 15]]
  },
  radioButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    color: primaryColor
  },
  dateRangePickerShowing: {
    display: 'block',
    height: '100%'
  },
  dateRangePickerHidden: {
    display: 'none',
    height: 0
  },
  download: {
    padding: [[10, 15]]
  },
  dateContainerWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: zircon,
    padding: [[0, 15]],
    minHeight: 70
  },
  arrowContainer: {
    position: 'absolute',
    left: 125,
    top: 26
  },
  arrow: {
    margin: 'auto'
  }
}

const useStyles = makeStyles(styles)
const ALL = 'all'
const RANGE = 'range'

const LogsDownloaderPopover = ({ name, query, args, title, getLogs }) => {
  const [selectedRadio, setSelectedRadio] = useState(ALL)
  const [range, setRange] = useState({ from: null, until: null })
  const [anchorEl, setAnchorEl] = useState(null)
  const [fetchLogs] = useLazyQuery(query, {
    onCompleted: data => {
      console.log(data)
      return createLogsFile(getLogs(data), range)
    }
  })

  const classes = useStyles()

  const dateRangePickerClasses = {
    [classes.dateRangePickerShowing]: selectedRadio === RANGE,
    [classes.dateRangePickerHidden]: selectedRadio === ALL
  }

  const handleRadioButtons = evt => {
    const selectedRadio = R.path(['target', 'value'])(evt)
    setSelectedRadio(selectedRadio)
    if (selectedRadio === ALL) setRange({ from: null, until: null })
  }

  const handleRangeChange = useCallback(
    (from, until) => {
      setRange({ from, until })
    },
    [setRange]
  )

  const downloadLogs = (range, args, fetchLogs) => {
    if (selectedRadio === ALL) {
      fetchLogs({
        variables: {
          ...args
        }
      })
    }

    if (!range || !range.from) return
    if (range.from && !range.until) range.until = moment()

    if (selectedRadio === RANGE) {
      fetchLogs({
        variables: {
          ...args,
          from: range.from,
          until: range.until
        }
      })
    }
  }

  const createLogsFile = (logs, range) => {
    const formatDateFile = date => {
      return moment(date).format('YYYY-MM-DD_HH-mm')
    }

    const blob = new window.Blob([logs], {
      type: 'text/plain;charset=utf-8'
    })

    FileSaver.saveAs(
      blob,
      selectedRadio === ALL
        ? `${formatDateFile(new Date())}_${name}.csv`
        : `${formatDateFile(range.from)}_${formatDateFile(
            range.until
          )}_${name}.csv`
    )
  }

  const handleOpenRangePicker = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClickAway = () => {
    setAnchorEl(null)
  }

  const radioButtonOptions = [
    { display: 'All logs', code: ALL },
    { display: 'Date range', code: RANGE }
  ]

  const open = Boolean(anchorEl)
  const id = open ? 'date-range-popover' : undefined

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div>
        <FeatureButton
          Icon={Download}
          InverseIcon={DownloadInverseIcon}
          onClick={handleOpenRangePicker}
          variant="contained"
        />
        <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom">
          <div className={classes.popoverContent}>
            <div className={classes.popoverHeader}>{title}</div>
            <div className={classes.radioButtonsContainer}>
              <RadioGroup
                name="logs-select"
                value={selectedRadio}
                options={radioButtonOptions}
                ariaLabel="logs-select"
                onChange={handleRadioButtons}
                className={classes.radioButtons}
              />
            </div>
            {selectedRadio === RANGE && (
              <div className={classnames(dateRangePickerClasses)}>
                <div className={classes.dateContainerWrapper}>
                  {range && (
                    <>
                      <DateContainer date={range.from}>From</DateContainer>
                      <div className={classes.arrowContainer}>
                        <Arrow className={classes.arrow} />
                      </div>
                      <DateContainer date={range.until}>To</DateContainer>
                    </>
                  )}
                </div>
                <DateRangePicker
                  maxDate={moment()}
                  onRangeChange={handleRangeChange}
                />
              </div>
            )}
            <div className={classes.download}>
              <Link
                color="primary"
                onClick={() => downloadLogs(range, args, fetchLogs)}>
                Download
              </Link>
            </div>
          </div>
        </Popper>
      </div>
    </ClickAwayListener>
  )
}

export default LogsDownloaderPopover
