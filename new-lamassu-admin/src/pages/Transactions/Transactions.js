import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { utils as coinUtils } from 'lamassu-coins'
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
    $limit: Int
    $from: Date
    $until: Date
    $timezone: String
  ) {
    transactionsCsv(
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
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

  const [filters, setFilters] = useState([])
  const { data: filtersResponse, loading: loadingFilters } = useQuery(
    GET_TRANSACTION_FILTERS
  )
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [variables, setVariables] = useState({ limit: NUM_LOG_RESULTS })
  const {
    data: txResponse,
    loading: loadingTransactions,
    refetch,
    startPolling,
    stopPolling
  } = useQuery(GET_TRANSACTIONS, {
    variables,
    onCompleted: data => setFilteredTransactions(R.path(['transactions'])(data))
  })

  useEffect(() => {
    startPolling(10000)
    return stopPolling
  })

  const { data: configResponse, configLoading } = useQuery(GET_DATA)
  const timezone = R.path(['config', 'locale_timezone'], configResponse)

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
        `${coinUtils
          .toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode)
          .toFormat(5)} ${it.cryptoCode}`
    },
    {
      header: 'Address',
      view: it => coinUtils.formatCryptoAddress(it.cryptoCode, it.toAddress),
      className: classes.overflowTd,
      size: 'sm',
      width: 140
    },
    {
      header: 'Date (UTC)',
      view: it =>
        timezone && formatDate(it.created, timezone, 'YYYY-MM-DD HH:mm:ss'),
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
    const filtersObject = R.compose(
      R.mergeAll,
      R.map(f => ({
        [f.type]: f.value
      }))
    )(filters)

    setFilters(filters)

    setVariables({
      limit: NUM_LOG_RESULTS,
      txClass: filtersObject.type,
      machineName: filtersObject.machine,
      customerName: filtersObject.customer,
      fiatCode: filtersObject.fiat,
      cryptoCode: filtersObject.crypto,
      toAddress: filtersObject.address,
      status: filtersObject.status
    })

    refetch && refetch()
  }

  const onFilterDelete = filter =>
    setFilters(
      R.filter(f => !R.whereEq(R.pick(['type', 'value'], f), filter))(filters)
    )

  const filterOptions = R.path(['transactionFilters'])(filtersResponse)

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Transactions</Title>
          <div className={classes.buttonsWrapper}>
            <SearchBox
              loading={loadingFilters}
              filters={filters}
              options={filterOptions}
              inputPlaceholder={'Search Transactions'}
              onChange={onFilterChange}
            />
          </div>
          {txResponse && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name="transactions"
                query={GET_TRANSACTIONS_CSV}
                args={{ timezone }}
                getLogs={logs => R.path(['transactionsCsv'])(logs)}
                timezone={timezone}
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
      {filters.length > 0 && (
        <SearchFilter
          filters={filters}
          onFilterDelete={onFilterDelete}
          setFilters={setFilters}
        />
      )}
      <DataTable
        loading={loadingTransactions && configLoading}
        emptyText="No transactions so far"
        elements={elements}
        data={filteredTransactions}
        Details={DetailsRow}
        expandable
        rowSize="sm"
        timezone={timezone}
      />
    </>
  )
}

export default Transactions
