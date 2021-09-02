import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import { EmptyTable } from 'src/components/table'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettes.styles.js'
import CashCassettesFooter from './CashCassettesFooter'

const useStyles = makeStyles(styles)

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required(),
  cashbox: Yup.number()
    .label('Cashbox')
    .required()
    .integer()
    .min(0)
    .max(1000),
  cassette1: Yup.number()
    .label('Cassette 1')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .label('Cassette 2')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette3: Yup.number()
    .label('Cassette 3')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette4: Yup.number()
    .label('Cassette 4')
    .required()
    .integer()
    .min(0)
    .max(500)
})

const GET_MACHINES_AND_CONFIG = gql`
  query getData {
    machines {
      name
      id: deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
      numberOfCassettes
    }
    config
  }
`

/* 
  // for cash in total calculation
  bills {
    fiat
    deviceId
    created
    cashbox
  }
*/

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashbox: Int!
    $cassette1: Int!
    $cassette2: Int!
    $cassette3: Int!
    $cassette4: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cashbox: $cashbox
      cassette1: $cassette1
      cassette2: $cassette2
      cassette3: $cassette3
      cassette4: $cassette4
    ) {
      deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
    }
  }
`

const CashCassettes = () => {
  const classes = useStyles()

  const { data } = useQuery(GET_MACHINES_AND_CONFIG)

  const machines = R.path(['machines'])(data) ?? []
  const config = R.path(['config'])(data) ?? {}
  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => ['getData']
  })
  const bills = R.groupBy(bill => bill.deviceId)(R.path(['bills'])(data) ?? [])
  const deviceIds = R.uniq(
    R.map(R.prop('deviceId'))(R.path(['bills'])(data) ?? [])
  )
  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const onSave = (
    ...[, { id, cashbox, cassette1, cassette2, cassette3, cassette4 }]
  ) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashbox,
        cassette1,
        cassette2,
        cassette3,
        cassette4
      }
    })
  }
  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const isCashOutDisabled = ({ id }) => !getCashoutSettings(id).active

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      width: 254,
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: 240,
      view: value => (
        <CashIn currency={{ code: fiatCurrency }} notes={value} total={0} />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  R.until(
    R.gt(R.__, Math.max(...R.map(it => it.numberOfCassettes, machines))),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cassette ${it}`,
        width: 265,
        stripe: true,
        view: (value, { id, numberOfCassettes }) => {
          return it > numberOfCassettes ? (
            <></>
          ) : (
            <CashOut
              className={classes.cashbox}
              denomination={getCashoutSettings(id)?.[`cassette${it}`]}
              currency={{ code: fiatCurrency }}
              notes={value}
            />
          )
        },
        input: CashCassetteInput,
        inputProps: {
          decimalPlaces: 0
        }
      })
      return R.add(1, it)
    },
    1
  )

  return (
    <>
      <TitleSection title="Cash Cassettes" />
      <div className={classes.tableContainer}>
        <EditableTable
          error={error?.message}
          name="cashboxes"
          enableEdit
          stripeWhen={isCashOutDisabled}
          elements={elements}
          data={machines}
          save={onSave}
          validationSchema={ValidationSchema}
          tbodyWrapperClass={classes.tBody}
        />

        {data && R.isEmpty(machines) && (
          <EmptyTable message="No machines so far" />
        )}
      </div>
      <CashCassettesFooter
        currencyCode={fiatCurrency}
        machines={machines}
        config={config}
        bills={bills}
        deviceIds={deviceIds}
      />
    </>
  )
}

export default CashCassettes
