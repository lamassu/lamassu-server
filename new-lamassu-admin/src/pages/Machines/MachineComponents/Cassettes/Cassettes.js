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
  2: { cashbox: 203, cassette: 280, cassetteGraph: 80, editWidth: 87 },
  3: { cashbox: 164, cassette: 200, cassetteGraph: 60, editWidth: 87 },
  4: { cashbox: 131, cassette: 158, cassetteGraph: 40, editWidth: 87 }
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
    .max(500),
  stacker1f: Yup.number()
    .label('Stacker 1F')
    .required('Required')
    .integer()
    .min(0)
    .max(60),
  stacker1r: Yup.number()
    .label('Stacker 1R')
    .required('Required')
    .integer()
    .min(0)
    .max(60),
  stacker2f: Yup.number()
    .label('Stacker 2F')
    .required('Required')
    .integer()
    .min(0)
    .max(60),
  stacker2r: Yup.number()
    .label('Stacker 2R')
    .required('Required')
    .integer()
    .min(0)
    .max(60),
  stacker3f: Yup.number()
    .label('Stacker 3F')
    .required('Required')
    .integer()
    .min(0)
    .max(60),
  stacker3r: Yup.number()
    .label('Stacker 3R')
    .required('Required')
    .integer()
    .min(0)
    .max(60)
})

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashUnits: CashUnitsInput
  ) {
    machineAction(deviceId: $deviceId, action: $action, cashUnits: $cashUnits) {
      deviceId
      cashUnits {
        cashbox
        cassette1
        cassette2
        cassette3
        cassette4
        stacker1f
        stacker1r
        stacker2f
        stacker2r
        stacker3f
        stacker3r
      }
    }
  }
`

const CashCassettes = ({ machine, config, refetchData, bills }) => {
  const classes = useStyles()

  const [wizard, setWizard] = useState(false)

  const cashout = config && fromNamespace('cashOut')(config)
  const locale = config && fromNamespace('locale')(config)
  const fillingPercentageSettings =
    config && fromNamespace('notifications', config)
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
        <CashIn
          currency={{ code: fiatCurrency }}
          notes={value}
          total={R.sum(R.map(it => it.fiat)(bills))}
        />
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
              threshold={
                fillingPercentageSettings[`fillingPercentageCassette${it}`]
              }
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
    width: widthsByNumberOfCassettes[numberOfCassettes].editWidth,
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
