import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettes.styles.js'

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
    .label('Cassette 1 (top)')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .label('Cassette 2 (bottom)')
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
    }
    config
  }
`

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashbox: Int!
    $cassette1: Int!
    $cassette2: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cashbox: $cashbox
      cassette1: $cassette1
      cassette2: $cassette2
    ) {
      deviceId
      cashbox
      cassette1
      cassette2
    }
  }
`

const CashCassettes = () => {
  const classes = useStyles()

  const { data } = useQuery(GET_MACHINES_AND_CONFIG)

  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => ['getData']
  })

  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const onSave = (...[, { id, cashbox, cassette1, cassette2 }]) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashbox,
        cassette1,
        cassette2
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
    },
    {
      name: 'cassette1',
      header: 'Cassette 1 (Top)',
      width: 265,
      stripe: true,
      view: (value, { id }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(id)?.top}
          currency={{ code: fiatCurrency }}
          notes={value}
        />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'cassette2',
      header: 'Cassette 2 (Bottom)',
      width: 265,
      stripe: true,
      view: (value, { id }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(id)?.bottom}
          currency={{ code: fiatCurrency }}
          notes={value}
        />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  return (
    <>
      <TitleSection title="Cash Cassettes" />

      <EditableTable
        error={error?.message}
        name="cashboxes"
        enableEdit
        stripeWhen={isCashOutDisabled}
        elements={elements}
        data={data && data.machines}
        save={onSave}
        validationSchema={ValidationSchema}
      />
    </>
  )
}

export default CashCassettes
