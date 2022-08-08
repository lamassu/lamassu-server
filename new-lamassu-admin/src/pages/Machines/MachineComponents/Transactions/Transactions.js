import { gql, useApolloClient, useLazyQuery } from '@apollo/client'
import { utils as coinUtils } from '@lamassu/coins'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'

import DetailsRow from 'src/pages/Transactions/DetailsCard'
import { mainStyles } from 'src/pages/Transactions/Transactions.styles'
import { getStatus } from 'src/pages/Transactions/helper'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import * as Customer from 'src/utils/customer'
import { formatDate } from 'src/utils/timezones'

import DataTable from './DataTable'
const useStyles = makeStyles(mainStyles)

const NUM_LOG_RESULTS = 5

const GET_TRANSACTIONS = gql`
  query transactions($limit: Int, $from: Date, $until: Date, $deviceId: ID) {
    transactions(
      limit: $limit
      from: $from
      until: $until
      deviceId: $deviceId
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
      rawTickerPrice
    }
  }
`

const GET_CONFIG = gql`
  query getConfig {
    config
  }
`

const Transactions = ({ id }) => {
  const classes = useStyles()

  const [extraHeight, setExtraHeight] = useState(0)
  const [clickedId, setClickedId] = useState('')

  const [getTx, { data: txResponse, loading }] = useLazyQuery(
    GET_TRANSACTIONS,
    {
      variables: {
        limit: NUM_LOG_RESULTS,
        deviceId: id
      }
    }
  )

  const configData = useApolloClient().readQuery({ query: GET_CONFIG })
  const timezone = R.path(['config', 'locale_timezone'], configData)

  if (!loading && txResponse) {
    txResponse.transactions = txResponse.transactions.splice(0, 5)
  }

  useEffect(() => {
    if (id !== null) {
      getTx()
    }
  }, [getTx, id])

  const elements = [
    {
      header: '',
      width: 0,
      size: 'sm',
      view: it => (it.txClass === 'cashOut' ? <TxOutIcon /> : <TxInIcon />)
    },
    {
      header: 'Customer',
      width: 122,
      size: 'sm',
      view: Customer.displayName
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
      width: 164,
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
      textAlign: 'left',
      width: 140
    },
    {
      header: 'Date',
      view: it => formatDate(it.created, timezone, 'yyyy‑MM‑dd'),
      textAlign: 'left',
      size: 'sm',
      width: 140
    },
    {
      header: 'Status',
      view: it => getStatus(it),
      size: 'sm',
      width: 20
    }
  ]

  const handleClick = e => {
    if (clickedId === e.id) {
      setClickedId('')
      setExtraHeight(0)
    } else {
      setClickedId(e.id)
      setExtraHeight(310)
    }
  }

  return (
    <DataTable
      extraHeight={extraHeight}
      onClick={handleClick}
      loading={loading || id === null}
      emptyText="No transactions so far"
      elements={elements}
      data={R.path(['transactions'])(txResponse)}
      Details={DetailsRow}
      expandable
    />
  )
}

export default Transactions
