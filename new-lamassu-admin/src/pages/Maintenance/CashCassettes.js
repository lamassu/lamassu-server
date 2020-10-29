import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettes.styles.js'

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

const GET_MACHINES_AND_CONFIG = gql`
  query getData {
    machines {
      name
      id: deviceId
      cassette1
      cassette2
    }
    config
  }
`

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

const CashCassettes = () => {
  const classes = useStyles()

  const { data } = useQuery(GET_MACHINES_AND_CONFIG)

  const [resetCashOut] = useMutation(RESET_CASHOUT_BILLS, {
    refetchQueries: () => ['getData'],
    onError: ({ graphQLErrors, message }) => {
      const errorMessage = graphQLErrors[0] ? graphQLErrors[0].message : message
      // TODO new-admin : this should not be final
      alert(JSON.stringify(errorMessage))
    }
  })

  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const onSave = (...[, { id, cassette1, cassette2 }]) => {
    return resetCashOut({
      variables: {
        action: 'resetCashOutBills',
        deviceId: id,
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
        name="cashboxes"
        enableEdit
        stripeWhen={isCashOutDisabled}
        disableRowEdit={isCashOutDisabled}
        elements={elements}
        data={data && data.machines}
        save={onSave}
        validationSchema={ValidationSchema}
      />
    </>
  )
}

export default CashCassettes
