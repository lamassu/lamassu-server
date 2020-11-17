import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React from 'react'
import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput } from 'src/components/inputs/formik'
import { fromNamespace } from 'src/utils/config'
import * as Yup from 'yup'

import styles from './Cassettes.styles'

const useStyles = makeStyles(styles)

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
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

const RESET_CASHOUT_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cassette1: Int!
    $cassette2: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cassette1: $cassette1
      cassette2: $cassette2
    ) {
      deviceId
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

  const [resetCashOut, { error }] = useMutation(RESET_CASHOUT_BILLS, {
    refetchQueries: () => refetchData()
  })

  const onSave = (...[, { deviceId, cassette1, cassette2 }]) => {
    return resetCashOut({
      variables: {
        action: 'resetCashOutBills',
        deviceId: deviceId,
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
      enableEdit
      data={[machine] || []}
      save={onSave}
      validationSchema={ValidationSchema}
    />
  ) : null
}

export default CashCassettes
