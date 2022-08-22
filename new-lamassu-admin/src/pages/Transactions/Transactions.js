import { useQuery } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import SearchBox from 'src/components/SearchBox'
import SearchFilter from 'src/components/SearchFilter'
import Title from 'src/components/Title'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ReactComponent as CustomerLinkIcon } from 'src/styling/icons/month arrows/right.svg'
import { ReactComponent as CustomerLinkWhiteIcon } from 'src/styling/icons/month arrows/right_white.svg'
import { errorColor } from 'src/styling/variables'
import * as Customer from 'src/utils/customer'
import { formatDate } from 'src/utils/timezones'

import DetailsRow from './DetailsCard'
import { mainStyles } from './Transactions.styles'
import { getStatus } from './helper'

const useStyles = makeStyles(mainStyles)

const NUM_LOG_RESULTS = 1000

const GET_DATA = gql`
  query getData {
    config
  }
`

const GET_TRANSACTIONS_CSV = gql`
  query transactions(
    $simplified: Boolean
    $limit: Int
    $from: Date
    $until: Date
    $timezone: String
    $excludeTestingCustomers: Boolean
  ) {
    transactionsCsv(
      simplified: $simplified
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
      excludeTestingCustomers: $excludeTestingCustomers
    )
  }
`

const GET_TRANSACTION_FILTERS = gql`
  query filters {
    transactionFilters {
      type
      value
    }
  }
`

const GET_TRANSACTIONS = gql`
  query transactions(
    $limit: Int
    $from: Date
    $until: Date
    $txClass: String
    $machineName: String
    $customerName: String
    $fiatCode: String
    $cryptoCode: String
    $toAddress: String
    $status: String
    $swept: Boolean
  ) {
    transactions(
      limit: $limit
      from: $from
      until: $until
      txClass: $txClass
      machineName: $machineName
      customerName: $customerName
      fiatCode: $fiatCode
      cryptoCode: $cryptoCode
      toAddress: $toAddress
      status: $status
      swept: $swept
    ) {
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
      txCustomerPhotoPath
      customerPhone
      discount
      customerId
      isAnonymous
      batched
      batchTime
      rawTickerPrice
      batchError
      walletScore
      profit
      swept
    }
  }
`

const getFiltersObj = filters =>
  R.reduce((s, f) => ({ ...s, [f.type]: f.value }), {}, filters)

const Transactions = () => {
  const classes = useStyles()
  const history = useHistory()

  const [filters, setFilters] = useState([])
  const { data: filtersResponse, loading: filtersLoading } = useQuery(
    GET_TRANSACTION_FILTERS
  )
  const [variables, setVariables] = useState({ limit: NUM_LOG_RESULTS })
  const {
    data: txData,
    loading: transactionsLoading,
    refetch,
    startPolling,
    stopPolling
  } = useQuery(GET_TRANSACTIONS, { variables })

  useEffect(() => {
    startPolling(10000)
    return stopPolling
  })

  const txList = txData?.transactions ?? []

  const { data: configResponse, configLoading } = useQuery(GET_DATA)
  const timezone = R.path(['config', 'locale_timezone'], configResponse)

  const redirect = customerId => {
    return history.push(`/compliance/customer/${customerId}`)
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
          <div className={classes.overflowTd}>{Customer.displayName(it)}</div>
          {!it.isAnonymous && (
            <div onClick={() => redirect(it.customerId)}>
              {it.hasError || it.batchError ? (
                <CustomerLinkWhiteIcon className={classes.customerLinkIcon} />
              ) : (
                <CustomerLinkIcon className={classes.customerLinkIcon} />
              )}
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
      width: 150,
      textAlign: 'right',
      size: 'sm',
      view: it =>
        `${coinUtils.toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode)} ${
          it.cryptoCode
        }`
    },
    {
      header: 'Address',
      view: it => coinUtils.formatCryptoAddress(it.cryptoCode, it.toAddress),
      className: classes.overflowTd,
      size: 'sm',
      width: 140
    },
    {
      header: 'Date',
      view: it =>
        timezone && formatDate(it.created, timezone, 'yyyy-MM-dd HH:mm'),
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

  const onFilterChange = filters => {
    const filtersObject = getFiltersObj(filters)

    setFilters(filters)

    setVariables({
      limit: NUM_LOG_RESULTS,
      txClass: filtersObject.type,
      machineName: filtersObject.machine,
      customerName: filtersObject.customer,
      fiatCode: filtersObject.fiat,
      cryptoCode: filtersObject.crypto,
      toAddress: filtersObject.address,
      status: filtersObject.status,
      swept: filtersObject.swept === 'Swept'
    })

    refetch && refetch()
  }

  const onFilterDelete = filter => {
    const newFilters = R.filter(
      f => !R.whereEq(R.pick(['type', 'value'], f), filter)
    )(filters)

    setFilters(newFilters)

    const filtersObject = getFiltersObj(newFilters)

    setVariables({
      limit: NUM_LOG_RESULTS,
      txClass: filtersObject.type,
      machineName: filtersObject.machine,
      customerName: filtersObject.customer,
      fiatCode: filtersObject.fiat,
      cryptoCode: filtersObject.crypto,
      toAddress: filtersObject.address,
      status: filtersObject.status,
      swept: filtersObject.swept === 'Swept'
    })

    refetch && refetch()
  }

  const deleteAllFilters = () => {
    setFilters([])
    const filtersObject = getFiltersObj([])

    setVariables({
      limit: NUM_LOG_RESULTS,
      txClass: filtersObject.type,
      machineName: filtersObject.machine,
      customerName: filtersObject.customer,
      fiatCode: filtersObject.fiat,
      cryptoCode: filtersObject.crypto,
      toAddress: filtersObject.address,
      status: filtersObject.status,
      swept: filtersObject.swept === 'Swept'
    })

    refetch && refetch()
  }

  const filterOptions = R.path(['transactionFilters'])(filtersResponse)

  const loading = transactionsLoading || filtersLoading || configLoading

  const errorLabel = (
    <svg width={12} height={12}>
      <rect width={12} height={12} rx={3} fill={errorColor} />
    </svg>
  )

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Transactions</Title>
          <div className={classes.buttonsWrapper}>
            <SearchBox
              loading={filtersLoading}
              filters={filters}
              options={filterOptions}
              inputPlaceholder={'Search Transactions'}
              onChange={onFilterChange}
            />
          </div>
          {txList && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name="transactions"
                query={GET_TRANSACTIONS_CSV}
                getLogs={logs => R.path(['transactionsCsv'])(logs)}
                simplified
                timezone={timezone}
                args={{ timezone }}
              />
            </div>
          )}
        </div>
        <div className={classes.headerLabels}>
          <div>
            <TxInIcon />
            <span>Cash-in</span>
          </div>
          <div>
            <TxOutIcon />
            <span>Cash-out</span>
          </div>
          <div>
            {errorLabel}
            <span>Transaction error</span>
          </div>
        </div>
      </div>
      {filters.length > 0 && (
        <SearchFilter
          entries={txList.length}
          filters={filters}
          onFilterDelete={onFilterDelete}
          deleteAllFilters={deleteAllFilters}
        />
      )}
      <DataTable
        loading={loading}
        emptyText="No transactions so far"
        elements={elements}
        data={txList}
        Details={DetailsRow}
        expandable
        rowSize="sm"
        timezone={timezone}
      />
    </>
  )
}

export default Transactions
