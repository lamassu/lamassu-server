import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
// import * as Yup from 'yup'

// import { Link, IconButton } from 'src/components/buttons'
// import { TextInput } from 'src/components/inputs'
import { NumberInput } from 'src/components/inputs/formik'
import DataTable from 'src/components/tables/DataTable'
// import { ReactComponent as EditIconDisabled } from 'src/styling/icons/action/edit/disabled.svg'
// import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { formatDate } from 'src/utils/timezones'

const GET_BATCHES = gql`
  query cashboxBatches {
    cashboxBatches {
      id
      deviceId
      created
      operationType
      customBillCount
      performedBy
      billCount
      fiatTotal
    }
  }
`

/* const EDIT_BATCH = gql`
  mutation editBatch($id: ID, $performedBy: String) {
    editBatch(id: $id, performedBy: $performedBy) {
      id
    }
  }
` */

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

/* const schema = Yup.object().shape({
  performedBy: Yup.string().nullable()
}) */

const useStyles = makeStyles(styles)

const CashboxHistory = ({ machines, currency, timezone }) => {
  const classes = useStyles()

  /* const [error, setError] = useState(false)
  const [field, setField] = useState(null)
  const [editing, setEditing] = useState(false) */

  const { data: batchesData, loading: batchesLoading } = useQuery(GET_BATCHES)

  /* const [editBatch] = useMutation(EDIT_BATCH, {
    refetchQueries: () => ['cashboxBatches']
  }) */

  const loading = batchesLoading

  const batches = R.path(['cashboxBatches'])(batchesData)

  const getOperationRender = R.reduce(
    (ret, i) =>
      R.pipe(
        R.assoc(
          `cash-cassette-${i}-refill`,
          <>
            <TxOutIcon />
            <span className={classes.operationType}>
              Cash cassette {i} refill
            </span>
          </>
        ),
        R.assoc(
          `cash-cassette-${i}-empty`,
          <>
            <TxOutIcon />
            <span className={classes.operationType}>
              Cash cassette {i} emptied
            </span>
          </>
        )
      )(ret),
    {
      'cash-box-empty': (
        <>
          <TxInIcon />
          <span className={classes.operationType}>Cash box emptied</span>
        </>
      )
    },
    R.range(1, 5)
  )

  /* const save = row => {
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
    return close()
  }

  const close = () => {
    setEditing(false)
    setField(null)
  }

  const notEditing = id => field?.id !== id */

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
      view: R.pipe(
        R.prop('deviceId'),
        id => R.find(R.propEq('id', id), machines),
        R.defaultTo({ name: <i>Unpaired device</i> }),
        R.prop('name')
      )
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
        R.isNil(it.customBillCount) ? it.billCount : it.customBillCount
    },
    {
      name: 'total',
      header: 'Total',
      width: 180,
      textAlign: 'right',
      view: it => (
        <span>
          {it.fiatTotal} {currency}
        </span>
      )
    },
    {
      name: 'date',
      header: 'Date',
      width: 135,
      textAlign: 'right',
      view: it => formatDate(it.created, timezone, 'yyyy-MM-dd')
    },
    {
      name: 'time',
      header: 'Time (h:m)',
      width: 125,
      textAlign: 'right',
      view: it => formatDate(it.created, timezone, 'HH:mm')
    }
    /* {
      name: 'performedBy',
      header: 'Performed by',
      width: 180,
      textAlign: 'left',
      view: it => {
        if (notEditing(it.id))
          return R.isNil(it.performedBy) ? 'Unknown entity' : it.performedBy
        return (
          <TextInput
            onChange={e => setField({ ...field, performedBy: e.target.value })}
            error={error}
            width={190 * 0.85}
            value={field?.performedBy}
          />
        )
      }
    },
    {
      name: '',
      header: 'Edit',
      width: 80,
      textAlign: 'right',
      view: it => {
        if (notEditing(it.id))
          return (
            <IconButton
              disabled={editing}
              onClick={() => {
                setField({ id: it.id, performedBy: it.performedBy })
                setEditing(true)
              }}>
              {editing ? <EditIconDisabled /> : <EditIcon />}
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
    } */
  ]

  return (
    <DataTable
      loading={loading}
      name="cashboxHistory"
      elements={elements}
      data={batches}
      emptyText="No cash box batches so far"
    />
  )
}

export default CashboxHistory
