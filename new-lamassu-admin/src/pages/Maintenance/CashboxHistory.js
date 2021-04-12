import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import { NumberInput } from 'src/components/inputs/formik'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

const GET_BATCHES = gql`
  query cashboxBatches {
    cashboxBatches {
      id
      deviceId
      created
      operationType
      customBillCount
      performedBy
      bills {
        fiat
        deviceId
        created
        cashbox
      }
    }
  }
`

const styles = {
  operationType: {
    marginLeft: 8
  },
  operationTypeWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
}

const useStyles = makeStyles(styles)

const CashboxHistory = ({ machines }) => {
  const classes = useStyles()
  const { data } = useQuery(GET_BATCHES)

  const batches = R.path(['cashboxBatches'])(data)

  const getOperationRender = {
    'cash-in-empty': (
      <>
        <TxInIcon />
        <span className={classes.operationType}>Cash-in emptied</span>
      </>
    ),
    'cash-out-1-refill': (
      <>
        <TxOutIcon />
        <span className={classes.operationType}>Cash-out 1 refill</span>
      </>
    ),
    'cash-out-1-empty': (
      <>
        <TxOutIcon />
        <span className={classes.operationType}>Cash-out 1 emptied</span>
      </>
    ),
    'cash-out-2-refill': (
      <>
        <TxOutIcon />
        <span className={classes.operationType}>Cash-out 2 refill</span>
      </>
    ),
    'cash-out-2-empty': (
      <>
        <TxOutIcon />
        <span className={classes.operationType}>Cash-out 2 emptied</span>
      </>
    )
  }

  const elements = [
    {
      name: 'operation',
      header: 'Operation',
      width: 200,
      textAlign: 'left',
      view: it => (
        <div className={classes.operationTypeWrapper}>
          {getOperationRender[it.operationType]}
        </div>
      )
    },
    {
      name: 'machine',
      header: 'Machine',
      width: 190,
      textAlign: 'left',
      view: it => {
        return R.find(R.propEq('id', it.deviceId))(machines).name
      }
    },
    {
      name: 'billCount',
      header: 'Bill Count',
      width: 115,
      textAlign: 'left',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      view: it =>
        R.isNil(it.customBillCount) ? it.bills.length : it.customBillCount
    },
    {
      name: 'total',
      header: 'Total',
      width: 125,
      textAlign: 'right',
      view: it => R.sum(R.map(b => R.prop('fiat', b), it.bills))
    },
    {
      name: 'date',
      header: 'Date',
      width: 125,
      textAlign: 'right',
      view: it => moment.utc(it.created).format('YYYY-MM-DD')
    },
    {
      name: 'time',
      header: 'Time (h:m)',
      width: 125,
      textAlign: 'right',
      view: it => moment.utc(it.created).format('HH:mm')
    },
    {
      name: 'performedBy',
      header: 'Performed by',
      width: 200,
      textAlign: 'left',
      view: it => (R.isNil(it.performedBy) ? 'Unknown entity' : it.performedBy)
    },
    {
      name: '',
      header: 'Edit',
      width: 120,
      textAlign: 'right',
      view: it => 'aaaaa'
    }
  ]

  return (
    <>
      <DataTable name="cashboxHistory" elements={elements} data={batches} />
    </>
  )
}

export default CashboxHistory
