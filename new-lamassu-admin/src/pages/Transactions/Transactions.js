import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'
import { useHistory } from 'react-router-dom'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ReactComponent as CustomerLinkIcon } from 'src/styling/icons/month arrows/right.svg'
import { toUnit, formatCryptoAddress } from 'src/utils/coin'

import DetailsRow from './DetailsCard'
import { mainStyles } from './Transactions.styles'
import { getStatus } from './helper'

const useStyles = makeStyles(mainStyles)

const NUM_LOG_RESULTS = 1000

const GET_TRANSACTIONS_CSV = gql`
  query transactions($limit: Int, $from: Date, $until: Date) {
    transactionsCsv(limit: $limit, from: $from, until: $until)
  }
`

const GET_TRANSACTIONS = gql`
  query transactions($limit: Int, $from: Date, $until: Date) {
    transactions(limit: $limit, from: $from, until: $until) {
      id
      txClass
      txHash
      toAddress
      commissionPercentage
      expired
      machineName
      operatorCompleted
      sendConfirmed
      dispense
      hasError: error
      deviceId
      fiat
      cashInFee
      fiatCode
      cryptoAtoms
      cryptoCode
      toAddress
      created
      customerName
      customerIdCardData
      customerIdCardPhotoPath
      customerFrontCameraPath
      customerPhone
      discount
      customerId
      isAnonymous
    }
  }
`

const Transactions = () => {
  const classes = useStyles()
  const history = useHistory()
  const { data: txResponse, loading } = useQuery(GET_TRANSACTIONS, {
    variables: {
      limit: NUM_LOG_RESULTS
    },
    pollInterval: 10000
  })

  const redirect = customerId => {
    return history.push(`/compliance/customer/${customerId}`)
  }

  const formatCustomerName = customer => {
    const { firstName, lastName } = customer

    return `${R.o(R.toUpper, R.head)(firstName)}. ${lastName}`
  }

  const getCustomerDisplayName = tx => {
    if (tx.customerName) return tx.customerName
    if (tx.customerIdCardData) return formatCustomerName(tx.customerIdCardData)
    return tx.customerPhone
  }
  const elements = [
    {
      header: '',
      width: 32,
      size: 'sm',
      view: it => (it.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />)
    },
    {
      header: 'Machine',
      name: 'machineName',
      width: 160,
      size: 'sm',
      view: R.path(['machineName'])
    },
    {
      header: 'Customer',
      width: 202,
      size: 'sm',
      view: it => (
        <div className={classes.flexWrapper}>
          <div className={classes.overflowTd}>{getCustomerDisplayName(it)}</div>
          {!it.isAnonymous && (
            <div onClick={() => redirect(it.customerId)}>
              <CustomerLinkIcon className={classes.customerLinkIcon} />
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Cash',
      width: 144,
      textAlign: 'right',
      size: 'sm',
      view: it => `${Number.parseFloat(it.fiat)} ${it.fiatCode}`
    },
    {
      header: 'Crypto',
      width: 144,
      textAlign: 'right',
      size: 'sm',
      view: it =>
        `${toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode).toFormat(5)} ${
          it.cryptoCode
        }`
    },
    {
      header: 'Address',
      view: it => formatCryptoAddress(it.cryptoCode, it.toAddress),
      className: classes.overflowTd,
      size: 'sm',
      width: 140
    },
    {
      header: 'Date (UTC)',
      view: it => moment.utc(it.created).format('YYYY-MM-DD HH:mm:ss'),
      textAlign: 'right',
      size: 'sm',
      width: 195
    },
    {
      header: 'Status',
      view: it => getStatus(it),
      textAlign: 'left',
      size: 'sm',
      width: 80
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Transactions</Title>
          {txResponse && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name="transactions"
                query={GET_TRANSACTIONS_CSV}
                getLogs={logs => R.path(['transactionsCsv'])(logs)}
              />
            </div>
          )}
        </div>
        <div className={classes.headerLabels}>
          <div>
            <TxOutIcon />
            <span>Cash-out</span>
          </div>
          <div>
            <TxInIcon />
            <span>Cash-in</span>
          </div>
        </div>
      </div>
      <DataTable
        loading={loading}
        emptyText="No transactions so far"
        elements={elements}
        data={R.path(['transactions'])(txResponse)}
        Details={DetailsRow}
        expandable
        rowSize="sm"
      />
    </>
  )
}

export default Transactions
