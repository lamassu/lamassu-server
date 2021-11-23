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
  const [error, setError] = useState(false)
  const [fields, setFields] = useState([])

  const { data, loading } = useQuery(GET_BATCHES)

  const [editBatch] = useMutation(EDIT_BATCH, {
    refetchQueries: () => ['cashboxBatches']
  })

  const batches = R.path(['cashboxBatches'])(data)

  const getOperationRender = R.reduce(
    (ret, i) =>
      R.pipe(
        R.assoc(
          `cash-out-${i}-refill`,
          <>
            <TxOutIcon />
            <span className={classes.operationType}>Cash-out {i} refill</span>
          </>
        ),
        R.assoc(
          `cash-out-${i}-empty`,
          <>
            <TxOutIcon />
            <span className={classes.operationType}>Cash-out {i} emptied</span>
          </>
        )
      )(ret),
    {
      'cash-in-empty': (
        <>
          <TxInIcon />
          <span className={classes.operationType}>Cash-in emptied</span>
        </>
      )
    },
    R.range(1, 5)
  )

  const save = row => {
    const field = R.find(f => f.id === row.id, fields)
    const performedBy = field.performedBy === '' ? null : field.performedBy

    schema
      .isValid(field)
      .then(() => {
        setError(false)
        editBatch({
          variables: { id: row.id, performedBy: performedBy }
        })
      })
      .catch(setError(true))
    return close(row.id)
  }

  const close = id => {
    setFields(R.filter(f => f.id !== id, fields))
  }

  const notEditing = id => !R.any(R.propEq('id', id), fields)

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
      width: 135,
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
      width: 180,
      textAlign: 'left',
      view: it => {
        if (notEditing(it.id))
          return R.isNil(it.performedBy) ? 'Unknown entity' : it.performedBy
        return (
          <TextInput
            onChange={e =>
              setFields(
                R.map(
                  f =>
                    f.id === it.id ? { ...f, performedBy: e.target.value } : f,
                  fields
                )
              )
            }
            error={error}
            width={190 * 0.85}
            value={R.prop(
              'performedBy',
              R.find(f => f.id === it.id, fields)
            )}
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
        if (notEditing(it.id))
          return (
            <IconButton
              onClick={() => {
                setFields([
                  ...fields,
                  { id: it.id, performedBy: it.performedBy }
                ])
              }}>
              <EditIcon />
            </IconButton>
          )
        return (
          <div className={classes.saveAndCancel}>
            <Link type="submit" color="primary" onClick={() => save(it)}>
              Save
            </Link>
            <Link color="secondary" onClick={() => close(it.id)}>
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
        <DataTable
          name="cashboxHistory"
          elements={elements}
          data={batches}
          emptyText="No cashbox batches so far"
        />
      )}
    </>
  )
}

export default CashboxHistory
