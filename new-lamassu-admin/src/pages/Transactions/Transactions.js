import React, { useState } from 'react'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import useAxios from '@use-hooks/axios'

import { toUnit } from '../../utils/coin'
import Title from '../../components/Title'
import ExpTable from '../../components/expandable-table/ExpTable'
import LogsDowloaderPopover from '../../components/LogsDownloaderPopper'
import { FeatureButton } from '../../components/buttons'
import { ReactComponent as TxInIcon } from '../../styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from '../../styling/icons/direction/cash-out.svg'
import { ReactComponent as Download } from '../../styling/icons/button/download/zodiac.svg'
import { ReactComponent as DownloadInverseIcon } from '../../styling/icons/button/download/white.svg'

import { mainStyles } from './Transactions.styles'
import DetailsRow from './DetailsCard'

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

    return `${R.o(R.toUpper, R.head)(firstName)}. ${lastName}`
  }

  const getCustomerDisplayName = (tx) => {
    if (tx.customerName) return tx.customerName
    if (tx.customerIdCardData) return formatCustomerName(tx.customerIdCardData)
    return tx.customerPhone
  }

  const elements = [
    {
      header: '',
      size: 62,
      view: it => it.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />
    },
    {
      header: 'Machine',
      name: 'machineName',
      size: 180,
      view: R.path(['machineName'])
    },
    {
      header: 'Customer',
      size: 162,
      view: getCustomerDisplayName
    },
    {
      header: 'Cash',
      size: 110,
      textAlign: 'right',
      view: it => `${Number.parseFloat(it.fiat)} ${it.fiatCode}`
    },
    {
      header: 'Crypto',
      size: 141,
      textAlign: 'right',
      view: it => `${toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode).toFormat(5)} ${it.cryptoCode}`
    },
    {
      header: 'Address',
      view: R.path(['toAddress']),
      className: classes.overflowTd,
      size: 136
    },
    {
      header: 'Date (UTC)',
      view: it => moment.utc(it.created).format('YYYY-MM-D'),
      textAlign: 'right',
      size: 124
    },
    {
      header: 'Time (UTC)',
      view: it => moment.utc(it.created).format('HH:mm:ss'),
      textAlign: 'right',
      size: 124
    },
    {
      header: '', // Trade
      size: 90
    },
    {
      size: 71
    }
  ]

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
      <ExpTable elements={elements} data={R.path(['data'])(txResponse)} Details={DetailsRow} />
    </>
  )
}

export default Transactions
