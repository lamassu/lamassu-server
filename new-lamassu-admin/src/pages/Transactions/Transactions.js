import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'

import Chip from 'src/components/Chip'
import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import SearchBox from 'src/components/SearchBox'
import Title from 'src/components/Title'
import DataTable from 'src/components/tables/DataTable'
import { P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { toUnit, formatCryptoAddress } from 'src/utils/coin'
// import { startCase } from 'src/utils/string'

import DetailsRow from './DetailsCard'
import { mainStyles, chipStyles } from './Transactions.styles'
import { getStatus /*, getStatusProperties */ } from './helper'

const useStyles = makeStyles(mainStyles)
const useChipStyles = makeStyles(chipStyles)

const NUM_LOG_RESULTS = 1000

const GET_TRANSACTIONS_CSV = gql`
  query transactions($limit: Int, $from: Date, $until: Date) {
    transactionsCsv(limit: $limit, from: $from, until: $until)
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
    }
  }
`

const Transactions = () => {
  const classes = useStyles()
  const chipClasses = useChipStyles()

  const [filters, setFilters] = useState([])
  const { data: filtersResponse, loading: loadingFilters } = useQuery(
    GET_TRANSACTION_FILTERS
  )
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [variables, setVariables] = useState({ limit: NUM_LOG_RESULTS })
  const { data: txResponse, loading: loadingTransactions, refetch } = useQuery(
    GET_TRANSACTIONS,
    {
      variables,
      onCompleted: data =>
        setFilteredTransactions(R.path(['transactions'])(data))
    }
  )

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
      width: 62,
      size: 'sm',
      view: it => (it.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />)
    },
    {
      header: 'Machine',
      name: 'machineName',
      width: 180,
      size: 'sm',
      view: R.path(['machineName'])
    },
    {
      header: 'Customer',
      width: 162,
      size: 'sm',
      view: getCustomerDisplayName
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
      width: 200
    },
    {
      header: 'Status',
      view: it => getStatus(it),
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
      {filters.length > 0 && (
        <>
          <P className={classes.text}>{'Filters:'}</P>
          <div>
            {filters.map((f, idx) => (
              <Chip
                key={idx}
                classes={chipClasses}
                label={`${f.type}: ${f.value}`}
                onDelete={() => onFilterDelete(f)}
                deleteIcon={<CloseIcon className={classes.button} />}
              />
            ))}
            <Chip
              classes={chipClasses}
              label={`Delete filters`}
              onDelete={() => setFilters([])}
              deleteIcon={<CloseIcon className={classes.button} />}
            />
          </div>
        </>
      )}
      <DataTable
        loading={loadingTransactions}
        emptyText="No transactions so far"
        elements={elements}
        data={filteredTransactions}
        Details={DetailsRow}
        expandable
      />
    </>
  )
}

export default Transactions
