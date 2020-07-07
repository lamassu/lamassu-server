import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import React, { useState } from 'react'
import * as Yup from 'yup'

import Prompt from 'src/components/Prompt'
import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  cassette1: Yup.number()
    .required('Required')
    .integer()
    .min(0),
  cassette2: Yup.number()
    .required('Required')
    .integer()
    .min(0)
})

const GET_MACHINES_AND_CONFIG = gql`
  {
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

const Cashboxes = () => {
  const [isUnsaved, setIsUnsaved] = useState(false)
  const { data } = useQuery(GET_MACHINES_AND_CONFIG)

  const [resetCashOut] = useMutation(RESET_CASHOUT_BILLS, {
    onError: ({ graphQLErrors, message }) => {
      const errorMessage = graphQLErrors[0] ? graphQLErrors[0].message : message
      // TODO: this should not be final
      alert(JSON.stringify(errorMessage))
    }
  })

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
      header: 'Cash-out 1',
      width: 265,
      textAlign: 'right',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'cassette2',
      header: 'Cash-out 2',
      width: 265,
      textAlign: 'right',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  return (
    <>
      <Prompt when={isUnsaved} />
      <TitleSection title="Cashboxes" />

      <EditableTable
        name="cashboxes"
        enableEdit
        elements={elements}
        data={data && data.machines}
        save={onSave}
        setEditing={setIsUnsaved}
        setAdding={setIsUnsaved}
        validationSchema={ValidationSchema}
      />
    </>
  )
}

export default Cashboxes
