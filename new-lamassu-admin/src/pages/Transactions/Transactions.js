import React, { useState } from 'react'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import { startCase, lowerCase } from 'lodash/fp'
import { makeStyles } from '@material-ui/core/styles'
import useAxios from '@use-hooks/axios'

import { mainStyles } from './Transactions.styles'
import DetailsRow from './DetailsCard'
import toUnit from './tx'

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

  const formatCustomerName = (customer) => {
    const { firstName, lastName } = customer

    return `${startCase(lowerCase(firstName.slice(0, 1)))}. ${startCase(lowerCase(lastName))}`
  }

  const getCustomerDisplayName = (tx) => {
    if (tx.customerName) return tx.customerName
    if (tx.customerIdCardData) return formatCustomerName(tx.customerIdCardData)
    return tx.customerPhone
  }

  const rows = txResponse && txResponse.data.map(tx => {
    const customerName = getCustomerDisplayName(tx)

    return {
      id: tx.id,
      columns: [
        {
          name: '',
          value: tx.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />,
          size: 62
        },
        {
          name: 'Machine',
          value: tx.machineName,
          size: 180
        },
        {
          name: 'Customer',
          value: customerName,
          size: 162
        },
        {
          name: 'Cash',
          value: `${Number.parseFloat(tx.fiat)} ${tx.fiatCode}`,
          textAlign: 'right',
          size: 110
        },
        {
          name: 'Crypto',
          value: `${toUnit(new BigNumber(tx.cryptoAtoms), tx.cryptoCode).toFormat(5)} ${tx.cryptoCode}`,
          textAlign: 'right',
          size: 141
        },
        {
          name: 'Address',
          value: tx.toAddress,
          className: classes.addressTd,
          size: 136
        },
        {
          name: 'Date (UTC)',
          value: moment.utc(tx.created).format('YYYY-MM-D'),
          textAlign: 'right',
          size: 124
        },
        {
          name: 'Time (UTC)',
          value: moment.utc(tx.created).format('HH:mm:ss'),
          textAlign: 'right',
          size: 124
        },
        {
          name: '', // Trade
          value: '',
          size: 90
        },
        {
          size: 71
        }
      ],
      details: (
        <DetailsRow tx={tx} />
      )
    }
  })

  const handleOpenRangePicker = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleCloseRangePicker = () => {
    setAnchorEl(null)
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
                name='transactions'
                id={id}
                open={open}
                anchorEl={anchorEl}
                logs={txResponse.data}
                getTimestamp={(tx) => tx.created}
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
      <ExpTable rows={rows} />
    </>
  )
}

export default Transactions
