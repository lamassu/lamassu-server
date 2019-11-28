import React, { useState } from 'react'
import FileSaver from 'file-saver'
import classnames from 'classnames'
import { toInteger } from 'lodash/fp'
import moment from 'moment'
import { makeStyles } from '@material-ui/core'

import { ReactComponent as Arrow } from '../styling/icons/arrow/download_logs.svg'
import typographyStyles from '../components/typography/styles'
import { primaryColor, offColor, zircon } from '../styling/variables'

import { Link } from './buttons'
import { RadioGroup } from './inputs'
import Popover from './Popover'
import DateRangePicker from './date-range-picker/DateRangePicker'

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
      {date &&
        <>
          <div className={classes.container}>
            <div className={classes.bigNumber}>{date.format('D')}</div>
            <div className={classes.monthWeekDayContainer}>
              <span className={classes.monthYear}>{`${date.format('MMM')} ${date.format('YYYY')}`}</span>
              <span className={classes.weekDay}>{date.format('dddd')}</span>
            </div>
          </div>
        </>}
    </div>
  )
}

const styles = {
  popoverContent: {
    width: 272
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
    left: 116,
    top: 26
  },
  arrow: {
    margin: 'auto'
  }
}

const useStyles = makeStyles(styles)

const LogsDownloaderPopover = ({ id, open, anchorEl, onClose, logsResponse, ...props }) => {
  const [radioButtons, setRadioButtons] = useState(0)
  const [range, setRange] = useState(null)

  const classes = useStyles()

  const dateRangePickerClasses = {
    [classes.dateRangePickerShowing]: radioButtons === 1,
    [classes.dateRangePickerHidden]: radioButtons === 0
  }

  const formatDateFile = date => {
    return moment(date).format('YYYY-MM-DD_HH-mm')
  }

  const handleRadioButtons = (event) => {
    setRadioButtons(toInteger(event.target.value))
  }

  const handleRangeChange = (from, to) => {
    setRange({ from, to })
  }

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
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
        <div className={classnames(dateRangePickerClasses)}>
          <div className={classes.dateContainerWrapper}>
            {range && (
              <>
                <DateContainer date={range.from}>From</DateContainer>
                <div className={classes.arrowContainer}>
                  <Arrow className={classes.arrow} />
                </div>
                <DateContainer date={range.to}>To</DateContainer>
              </>
            )}
          </div>
          <DateRangePicker
            maxDate={moment()}
            onRangeChange={handleRangeChange}
          />
        </div>
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
  )
}

export default LogsDownloaderPopover
