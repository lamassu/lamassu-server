import React, { useState } from 'react'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import FileSaver from 'file-saver'
import { startCase, lowerCase } from 'lodash/fp'
import { makeStyles } from '@material-ui/core/styles'
import useAxios from '@use-hooks/axios'

import { mainStyles } from './Transactions.styles'
import DetailsRow from './DetailsCard'
import { toUnit } from './tx'

import Title from '../../components/Title'
import ExpTable from '../../components/expandable-table/ExpTable'
import LogsDowloaderPopover from '../../components/LogsDownloaderPopper'
import { FeatureButton } from '../../components/buttons'
import { ReactComponent as TxInIcon } from '../../styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from '../../styling/icons/direction/cash-out.svg'
import { ReactComponent as Download } from '../../styling/icons/button/download/zodiac.svg'
import { ReactComponent as DownloadInverseIcon } from '../../styling/icons/button/download/white.svg'

const Transactions = () => {
  const [anchorEl, setAnchorEl] = useState(null)

  const useStyles = makeStyles(mainStyles)

  const classes = useStyles()

  const { response: txResponse } = useAxios({
    url: 'http://localhost:8070/api/txs/',
    method: 'GET',
    trigger: []
  })

  const headers = [
    {
      value: ''
    },
    {
      value: 'Machine'
    },
    {
      value: 'Customer'
    },
    {
      value: 'Cash',
      textAlign: 'right'
    },
    {
      value: 'Crypto',
      textAlign: 'right'
    },
    {
      value: 'Address'
    },
    {
      value: 'Date (UTC)',
      textAlign: 'right'
    },
    {
      value: 'Time (UTC)',
      textAlign: 'right'
    },
    {
      value: '', // Trade
      textAlign: 'center'
    },
    {
      value: ''
    }
  ]

  const rows = txResponse && txResponse.data.map(tx => {
    const customerName = tx.customerName ? tx.customerName
      : (tx.customerIdCardData ? `${startCase(lowerCase(tx.customerIdCardData.firstName.slice(0, 1)))}. ${startCase(lowerCase(tx.customerIdCardData.lastName))}` : tx.customerPhone)

    return {
      id: tx.id,
      columns: [
        {
          value: tx.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />
        },
        {
          value: tx.machineName
        },
        {
          value: customerName
        },
        {
          value: `${Number.parseFloat(tx.fiat)} ${tx.fiatCode}`,
          textAlign: 'right'
        },
        {
          value: `${toUnit(new BigNumber(tx.cryptoAtoms)).toFormat(5)} ${tx.cryptoCode}`,
          textAlign: 'right'
        },
        {
          value: `${tx.toAddress.slice(0, 9)}...`
        },
        {
          value: moment(tx.created).format('YYYY-MM-D'),
          textAlign: 'right'
        },
        {
          value: moment(tx.created).format('HH:mm:ss'),
          textAlign: 'right'
        },
        {
          value: ''
        }
      ],
      details: (
        <DetailsRow tx={tx} />
      )
    }
  })

  const sizes = [
    62, // Class
    180, // Machine
    162, // Customer
    110, // Cash
    141, // Crypto
    136, // Address
    124, // Date
    124, // Time
    90, // Trade
    71 // Expand
  ]

  const handleOpenRangePicker = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleCloseRangePicker = () => {
    setAnchorEl(null)
  }

  const downloadTxLogs = (range, txs) => {
    if (!range) return

    if (range.from && !range.to) range.to = moment()

    const formatDateFile = date => {
      return moment(date).format('YYYY-MM-DD_HH-mm')
    }

    if (!range.from && !range.to) {
      const text = txs.map(it => JSON.stringify(it)).join('\n')
      const blob = new window.Blob([text], {
        type: 'text/plain;charset=utf-8'
      })
      FileSaver.saveAs(blob, `${formatDateFile(new Date())}_transactions`)
      return
    }

    if (range.from && range.to) {
      const text = txs.filter((tx) => moment(tx.created).isBetween(range.from, range.to, 'day', '[]')).map(it => JSON.stringify(it)).join('\n')
      const blob = new window.Blob([text], {
        type: 'text/plain;charset=utf-8'
      })
      FileSaver.saveAs(blob, `${formatDateFile(range.from)}_${formatDateFile(range.to)}_transactions`)
    }
  }

  const open = Boolean(anchorEl)
  const id = open ? 'date-range-popover' : undefined

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Transactions</Title>
          {txResponse && (
            <div className={classes.buttonsWrapper}>
              <FeatureButton
                Icon={Download}
                InverseIcon={DownloadInverseIcon}
                aria-describedby={id}
                variant='contained'
                onClick={handleOpenRangePicker}
              />
              <LogsDowloaderPopover
                title='Download logs'
                id={id}
                open={open}
                anchorEl={anchorEl}
                logs={txResponse.data}
                onDownload={downloadTxLogs}
                onClose={handleCloseRangePicker}
              />
            </div>
          )}
        </div>
        <div className={classes.headerLabels}>
          <div><TxOutIcon /><span>Cash-out</span></div>
          <div><TxInIcon /><span>Cash-in</span></div>
        </div>
      </div>
      <ExpTable headers={headers} rows={rows} sizes={sizes} />
    </>
  )
}

export default Transactions
