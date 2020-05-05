import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import {
  CashIn,
  CashOut,
  CashOutFormik,
  CashInFormik
} from 'src/components/inputs/cashbox/Cashbox'
import TitleSection from 'src/components/layout/TitleSection'
import { ReactComponent as ErrorIcon } from 'src/styling/icons/status/tomato.svg'

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  cashin: Yup.object()
    .required('Required')
    .shape({
      notes: Yup.number()
        .required('Required')
        .integer()
        .min(0)
    }),
  cashout1: Yup.object()
    .required('Required')
    .shape({
      notes: Yup.number()
        .required('Required')
        .integer()
        .min(0),
      denomination: Yup.number()
        .required('Required')
        .integer()
        .default(0)
    }),
  cashout2: Yup.object()
    .required('Required')
    .shape({
      notes: Yup.number()
        .required('Required')
        .integer()
        .min(0),
      denomination: Yup.number()
        .required('Required')
        .integer()
        .default(0)
    })
})

const GET_MACHINES_AND_CONFIG = gql`
  {
    machines {
      name
      deviceId
      cashbox
      cassette1
      cassette2
    }
    config
  }
`

const EMPTY_CASHIN_BILLS = gql`
  mutation MachineAction($deviceId: ID!, $action: MachineAction!) {
    machineAction(deviceId: $deviceId, action: $action) {
      deviceId
      cashbox
      cassette1
      cassette2
    }
  }
`

const RESET_CASHOUT_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cassettes: [Int]!
  ) {
    machineAction(deviceId: $deviceId, action: $action, cassettes: $cassettes) {
      deviceId
      cashbox
      cassette1
      cassette2
    }
  }
`

const Cashboxes = () => {
  const [machines, setMachines] = useState([])

  useQuery(GET_MACHINES_AND_CONFIG, {
    onCompleted: ({ machines, config }) =>
      setMachines(
        machines.map(m => ({
          ...m,
          currency: { code: config.locale_fiatCurrency ?? '' },
          denominations: {
            top: config[`denominations_${m.deviceId}_top`],
            bottom: config[`denominations_${m.deviceId}_bottom`]
          }
        }))
      )
  })

  const [resetCashOut] = useMutation(RESET_CASHOUT_BILLS, {
    onError: ({ graphQLErrors, message }) => {
      const errorMessage = graphQLErrors[0] ? graphQLErrors[0].message : message
      // TODO: this should not be final
      alert(JSON.stringify(errorMessage))
    }
  })

  const [onEmpty] = useMutation(EMPTY_CASHIN_BILLS, {
    onError: ({ graphQLErrors, message }) => {
      const errorMessage = graphQLErrors[0] ? graphQLErrors[0].message : message
      // TODO: this should not be final
      alert(JSON.stringify(errorMessage))
    }
  })

  const onSave = (_, { cashin, cashout1, cashout2 }) =>
    resetCashOut({
      variables: {
        deviceId: cashin.deviceId,
        action: 'resetCashOutBills',
        cassettes: [Number(cashout1.notes), Number(cashout2.notes)]
      }
    })

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      width: 254,
      textAlign: 'left',
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashin',
      header: 'Cash-in',
      width: 265,
      textAlign: 'left',
      view: props => <CashIn {...props} />,
      input: props => <CashInFormik onEmpty={onEmpty} {...props} />
    },
    {
      name: 'cashout1',
      header: 'Cash-out 1',
      width: 265,
      textAlign: 'left',
      view: props => <CashOut {...props} />,
      input: CashOutFormik
    },
    {
      name: 'cashout2',
      header: 'Cash-out 2',
      width: 265,
      textAlign: 'left',
      view: props => <CashOut {...props} />,
      input: CashOutFormik
    }
  ]

  const data = machines.map(
    ({
      name,
      cassette1,
      cassette2,
      currency,
      denominations: { top, bottom },
      cashbox,
      deviceId
    }) => ({
      id: deviceId,
      name,
      cashin: { notes: cashbox, deviceId },
      cashout1: { notes: cassette1, denomination: top, currency },
      cashout2: { notes: cassette2, denomination: bottom, currency }
    })
  )

  return (
    <>
      <TitleSection
        title="Cashboxes"
        labels={
          <>
            <ErrorIcon />
            <span>Action required</span>
          </>
        }
      />

      <EditableTable
        name="cashboxes"
        enableEdit
        elements={elements}
        data={data}
        save={onSave}
        validationSchema={ValidationSchema}
      />
    </>
  )
}

export default Cashboxes
