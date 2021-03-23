import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput } from 'src/components/inputs/formik'
import { fromNamespace } from 'src/utils/config'

import styles from './Cassettes.styles'

const useStyles = makeStyles(styles)

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  cashbox: Yup.number()
    .label('Cashbox')
    .required()
    .integer()
    .min(0)
    .max(1000),
  cassette1: Yup.number()
    .required('Required')
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .required('Required')
    .integer()
    .min(0)
    .max(500)
})

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

const CashCassettes = ({ machine, config, refetchData }) => {
  const data = { machine, config }
  const classes = useStyles()

  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const getCashoutSettings = deviceId => fromNamespace(deviceId)(cashout)
  const isCashOutDisabled = ({ deviceId }) =>
    !getCashoutSettings(deviceId).active

  const elements = [
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: 240,
      stripe: false,
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
      header: 'Cash-out 1',
      width: 265,
      stripe: true,
      view: (value, { deviceId }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(deviceId)?.bottom}
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
      header: 'Cash-out 2',
      width: 265,
      stripe: true,
      view: (value, { deviceId }) => {
        return (
          <CashOut
            className={classes.cashbox}
            denomination={getCashoutSettings(deviceId)?.top}
            currency={{ code: fiatCurrency }}
            notes={value}
          />
        )
      },
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => refetchData()
  })

  const onSave = (...[, { deviceId, cashbox, cassette1, cassette2 }]) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: deviceId,
        cashbox,
        cassette1,
        cassette2
      }
    })
  }

  return machine.name ? (
    <EditableTable
      error={error?.message}
      stripeWhen={isCashOutDisabled}
      disableRowEdit={isCashOutDisabled}
      name="cashboxes"
      elements={elements}
      data={[machine] || []}
      save={onSave}
      validationSchema={ValidationSchema}
    />
  ) : null
}

export default CashCassettes
