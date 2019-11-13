import React, { useState } from 'react'
import FileSaver from 'file-saver'
import classnames from 'classnames'
import { toInteger } from 'lodash/fp'
import moment from 'moment'
import { makeStyles } from '@material-ui/core'

import typographyStyles from '../components/typography/styles'
import { primaryColor } from '../styling/variables'

import { Link } from './buttons'
import { RadioGroup } from './inputs'
import Popover from './Popover'
import DateRangePicker from './date-range-picker/DateRangePicker'

const { h4 } = typographyStyles

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
  )
}

export default LogsDownloaderPopover
