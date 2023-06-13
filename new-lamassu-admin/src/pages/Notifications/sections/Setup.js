import * as R from 'ramda'
import React from 'react'

import {
  Table,
  THead,
  TBody,
  Tr,
  Td,
  Th
} from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { startCase } from 'src/utils/string'

const channelSize = 110
const sizes = {
  balance: 140,
  transactions: 140,
  compliance: 140,
  errors: 140,
  security: 140,
  active: 100
}

const Row = ({
  namespace,
  data,
  forceDisable,
  turnOnToggle,
  turnOffToggle,
  shouldUpperCase,
  onActivation
}) => {
  const { notificationChannelPreferences, notificationPreferences } = data
  const isRowChannelDisabled = !R.find(it => it.channel === namespace)(
    notificationChannelPreferences
  ).active

  const Cell = ({ name, disabled }) => {
    const field =
      name === 'channel'
        ? R.find(it => it.channel === namespace)(notificationChannelPreferences)
        : R.find(it => it.category === name && it.channel === namespace)(
            notificationPreferences
          )
    const value = field.active

    const onChange = event => {
      if (name === 'channel' && value === false) {
        if (!onActivation()) return
      }

      const res = { channelName: namespace }
      if (name !== 'channel') res.categoryName = name

      return event.target.checked ? turnOnToggle(res) : turnOffToggle(res)
    }

    return (
      <Td width={sizes[name]} textAlign="center">
        <Switch
          disabled={disabled}
          checked={value}
          onChange={onChange}
          value={value}
        />
      </Td>
    )
  }

  return (
    <Tr>
      <Td width={channelSize}>
        {shouldUpperCase ? R.toUpper(namespace) : startCase(namespace)}
      </Td>
      <Cell name="balance" disabled={isRowChannelDisabled} />
      <Cell name="transactions" disabled={isRowChannelDisabled} />
      <Cell name="compliance" disabled={isRowChannelDisabled} />
      <Cell name="errors" disabled={isRowChannelDisabled} />
      <Cell name="security" disabled={isRowChannelDisabled} />
      <Cell name="channel" disabled={false} />
    </Tr>
  )
}

const Setup = ({
  twilioAvailable,
  mailgunAvailable,
  setSmsSetupPopup,
  setEmailSetupPopup,
  turnOffToggle,
  turnOnToggle,
  notificationPreferences,
  notificationChannelPreferences
}) => {
  const namespaces = [
    {
      name: 'email',
      shouldUpperCase: false,
      onActivation: () => {
        if (mailgunAvailable) return true
        setEmailSetupPopup(true)
        return false
      }
    },
    {
      name: 'sms',
      shouldUpperCase: true,
      onActivation: () => {
        if (twilioAvailable) return true
        setSmsSetupPopup(true)
        return false
      }
    },
    {
      name: 'admin',
      shouldUpperCase: false,
      onActivation: () => true
    }
  ]

  return (
    <Table>
      <THead>
        <Th width={channelSize}>Channel</Th>
        {Object.keys(sizes).map(it => (
          <Th key={it} width={sizes[it]} textAlign="center">
            {startCase(it)}
          </Th>
        ))}
      </THead>
      <TBody>
        {namespaces.map(namespace => (
          <Row
            namespace={namespace.name}
            forceDisable={false}
            turnOnToggle={turnOnToggle}
            turnOffToggle={turnOffToggle}
            data={{ notificationPreferences, notificationChannelPreferences }}
            shouldUpperCase={namespace.shouldUpperCase}
            onActivation={namespace.onActivation}
          />
        ))}
      </TBody>
    </Table>
  )
}

export default Setup
