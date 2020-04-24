import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { gql } from 'apollo-boost'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Title from 'src/components/Title'
import { Table as EditableTable } from 'src/components/editableTable'
import {
  CashIn,
  CashOut,
  CashOutFormik,
  CashInFormik
} from 'src/components/inputs/cashbox/Cashbox'
import { mainStyles } from 'src/pages/Transactions/Transactions.styles'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
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

const useStyles = makeStyles(mainStyles)

const Cashboxes = () => {
  const [machines, setMachines] = useState([])
  const classes = useStyles()

  useQuery(GET_MACHINES_AND_CONFIG, {
    onCompleted: data =>
      setMachines(
        data.machines.map(m => ({
          ...m,
          // TODO: move this to the new flat config style
          currency: data.config.fiatCurrency ?? { code: 'N/D' },
          denominations: (data.config.cashOutDenominations ?? {})[
            m.deviceId
          ] || { top: 11111, bottom: 22222 }
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

  const onSave = ({ cashin, cashout1, cashout2 }, { setSubmitting }) =>
    resetCashOut({
      variables: {
        deviceId: cashin.deviceId,
        action: 'resetCashOutBills',
        cassettes: [Number(cashout1.notes), Number(cashout2.notes)]
      }
    }).then(() => setSubmitting(false))

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      size: 254,
      textAlign: 'left',
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashin',
      header: 'Cash-in',
      size: 265,
      textAlign: 'left',
      view: props => <CashIn {...props} />,
      input: props => <CashInFormik onEmpty={onEmpty} {...props} />
    },
    {
      name: 'cashout1',
      header: 'Cash-out 1',
      size: 265,
      textAlign: 'left',
      view: props => <CashOut {...props} />,
      input: CashOutFormik
    },
    {
      name: 'cashout2',
      header: 'Cash-out 2',
      size: 265,
      textAlign: 'left',
      view: props => <CashOut {...props} />,
      input: CashOutFormik
    },
    {
      name: 'edit',
      header: 'Update',
      size: 151,
      textAlign: 'right',
      view: onclick => <EditIcon onClick={onclick} />
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
      name,
      cashin: { notes: cashbox, deviceId },
      cashout1: { notes: cassette1, denomination: top, currency },
      cashout2: { notes: cassette2, denomination: bottom, currency }
    })
  )

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Cashboxes</Title>
        </div>
        <div className={classes.headerLabels}>
          <ErrorIcon />
          <span>Action required</span>
        </div>
      </div>
      <EditableTable
        elements={elements}
        data={data}
        save={onSave}
        validationSchema={ValidationSchema}
      />
    </>
  )
}

export default Cashboxes
