import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { Link, IconButton } from 'src/components/buttons'
import { TextInput } from 'src/components/inputs'
import { NumberInput } from 'src/components/inputs/formik'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
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

const EDIT_BATCH = gql`
  mutation editBatch($id: ID, $performedBy: String) {
    editBatch(id: $id, performedBy: $performedBy) {
      id
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
  },
  saveAndCancel: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}

const schema = Yup.object().shape({
  performedBy: Yup.string().nullable()
})

const useStyles = makeStyles(styles)

const CashboxHistory = ({ machines, currency }) => {
  const classes = useStyles()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(false)
  const [fields, setFields] = useState({})

  const { data, loading } = useQuery(GET_BATCHES)

  const [editBatch] = useMutation(EDIT_BATCH, {
    refetchQueries: () => ['cashboxBatches']
  })

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

  const save = row => {
    schema
      .isValid(fields)
      .then(() => {
        setError(false)
        editBatch({
          variables: { id: row.id, performedBy: fields?.performedBy }
        })
      })
      .catch(setError(true))
    return close()
  }

  const close = () => {
    setFields({})
    return setEditing(false)
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
      width: 200,
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
      width: 100,
      textAlign: 'right',
      view: it => (
        <span>
          {R.sum(R.map(b => R.prop('fiat', b), it.bills))} {currency}
        </span>
      )
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
      width: 190,
      textAlign: 'left',
      view: it => {
        if (!editing)
          return R.isNil(it.performedBy) ? 'Unknown entity' : it.performedBy
        return (
          <TextInput
            onChange={e =>
              setFields({ ...fields, performedBy: e.target.value })
            }
            error={error}
            width={190 * 0.85}
            value={fields.performedBy ?? ''}
          />
        )
      }
    },
    {
      name: '',
      header: 'Edit',
      width: 150,
      textAlign: 'right',
      view: it => {
        if (!editing)
          return (
            <IconButton
              onClick={() => {
                setFields({})
                setEditing(true)
              }}>
              <EditIcon />
            </IconButton>
          )
        return (
          <div className={classes.saveAndCancel}>
            <Link type="submit" color="primary" onClick={() => save(it)}>
              Save
            </Link>
            <Link color="secondary" onClick={close}>
              Cancel
            </Link>
          </div>
        )
      }
    }
  ]

  return (
    <>
      {!loading && (
        <DataTable name="cashboxHistory" elements={elements} data={batches} />
      )}
    </>
  )
}

export default CashboxHistory
