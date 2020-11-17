import { useLazyQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useEffect, useState } from 'react'

import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { toUnit, formatCryptoAddress } from 'src/utils/coin'

import DataTable from './DataTable'
import DetailsRow from './DetailsCard'
import { mainStyles } from './Transactions.styles'
import { getStatus } from './helper'

const useStyles = makeStyles(mainStyles)

const NUM_LOG_RESULTS = 5

const GET_TRANSACTIONS = gql`
  query transactions($limit: Int, $from: Date, $until: Date, $id: ID) {
    transactions(limit: $limit, from: $from, until: $until, id: $id) {
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

const Transactions = ({ id }) => {
  const classes = useStyles()

  const [extraHeight, setExtraHeight] = useState(0)
  const [clickedId, setClickedId] = useState('')

  const [getTx, { data: txResponse, loading }] = useLazyQuery(
    GET_TRANSACTIONS,
    {
      variables: {
        limit: NUM_LOG_RESULTS,
        id
      }
    }
  )

  if (!loading && txResponse) {
    txResponse.transactions = txResponse.transactions.splice(0, 5)
  }

  useEffect(() => {
    if (id !== null) {
      getTx()
    }
  }, [getTx, id])

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
      width: 164,
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
      textAlign: 'left',
      width: 170
    },
    {
      header: 'Date (UTC)',
      view: it => moment.utc(it.created).format('YYYY-MM-DD'),
      textAlign: 'left',
      size: 'sm',
      width: 150
    },
    {
      header: 'Status',
      view: it => getStatus(it),
      size: 'sm',
      width: 80
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
    <>
      <DataTable
        extraHeight={extraHeight}
        onClick={handleClick}
        loading={loading || id === null}
        emptyText="No transactions so far"
        elements={elements}
        // need to splice because back end query could return double NUM_LOG_RESULTS because it doesnt merge the txIn and the txOut results before applying the limit
        data={R.path(['transactions'])(txResponse)} // .splice(0,NUM_LOG_RESULTS)}
        Details={DetailsRow}
        expandable
      />
    </>
  )
}

export default Transactions
