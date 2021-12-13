import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { IconButton } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import Wizard from 'src/pages/Maintenance/Wizard/Wizard'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
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
    .label('Cash box')
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

  const [wizard, setWizard] = useState(false)

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
      header: 'Cash box',
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
        header: `Cash cassette ${it}`,
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

  elements.push({
    name: 'edit',
    header: 'Edit',
    width: 87,
    view: () => {
      return (
        <IconButton
          onClick={() => {
            setWizard(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    }
  })

  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => refetchData()
  })

  const onSave = (_, cashbox, cassettes) =>
    setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: machine.deviceId,
        cashbox,
        ...cassettes
      }
    })

  return machine.name ? (
    <>
      <EditableTable
        error={error?.message}
        editWidth={widthsByNumberOfCassettes[numberOfCassettes].editWidth}
        stripeWhen={isCashOutDisabled}
        disableRowEdit={isCashOutDisabled}
        name="cashboxes"
        elements={elements}
        data={[machine]}
        save={onSave}
        validationSchema={ValidationSchema}
      />
      {wizard && (
        <Wizard
          machine={machine}
          cashoutSettings={getCashoutSettings(machine.deviceId)}
          onClose={() => {
            setWizard(false)
          }}
          error={error?.message}
          save={onSave}
          locale={locale}
        />
      )}
    </>
  ) : null
}

export default CashCassettes
