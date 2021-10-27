/* eslint-disable no-unused-vars */
import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import { fromNamespace } from 'src/utils/config'

import styles from './Cassettes.styles'

const useStyles = makeStyles(styles)

const widthsByNumberOfCassettes = {
  2: { cashbox: 116, cassette: 280, cassetteGraph: 80, editWidth: 174 },
  3: { cashbox: 106, cassette: 200, cassetteGraph: 60, editWidth: 145 },
  4: { cashbox: 106, cassette: 164, cassetteGraph: 40, editWidth: 90 }
}

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
    .max(500),
  cassette3: Yup.number()
    .required('Required')
    .integer()
    .min(0)
    .max(500),
  cassette4: Yup.number()
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

const CashCassettes = ({ machine, config, refetchData }) => {
  const data = { machine, config }
  const classes = useStyles()

  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency
  const numberOfCassettes = machine.numberOfCassettes

  const getCashoutSettings = deviceId => fromNamespace(deviceId)(cashout)
  const isCashOutDisabled = ({ deviceId }) =>
    !getCashoutSettings(deviceId).active

  const elements = [
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: widthsByNumberOfCassettes[numberOfCassettes].cashbox,
      stripe: false,
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
    R.gt(R.__, numberOfCassettes),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cash-out ${it}`,
        width: widthsByNumberOfCassettes[numberOfCassettes].cassette,
        stripe: true,
        doubleHeader: 'Cash-out',
        view: value => {
          return (
            <CashOut
              className={classes.cashbox}
              denomination={
                getCashoutSettings(machine.deviceId)?.[`cassette${it}`]
              }
              currency={{ code: fiatCurrency }}
              notes={value}
              width={widthsByNumberOfCassettes[numberOfCassettes].cassetteGraph}
            />
          )
        },
        isHidden: ({ numberOfCassettes }) => it > numberOfCassettes,
        input: CashCassetteInput,
        inputProps: {
          decimalPlaces: 0,
          width: widthsByNumberOfCassettes[numberOfCassettes].cassetteGraph,
          inputClassName: classes.cashbox
        }
      })
      return R.add(1, it)
    },
    1
  )

  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => refetchData()
  })

  const onSave = (
    ...[, { deviceId, cashbox, cassette1, cassette2, cassette3, cassette4 }]
  ) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: deviceId,
        cashbox,
        cassette1,
        cassette2,
        cassette3,
        cassette4
      }
    })
  }

  return machine.name ? (
    <EditableTable
      error={error?.message}
      enableEdit
      editWidth={widthsByNumberOfCassettes[numberOfCassettes].editWidth}
      stripeWhen={isCashOutDisabled}
      disableRowEdit={isCashOutDisabled}
      name="cashboxes"
      elements={elements}
      data={[machine]}
      save={onSave}
      validationSchema={ValidationSchema}
    />
  ) : null
}

export default CashCassettes
