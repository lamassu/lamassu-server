import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React, { useContext } from 'react'

import {
  Table,
  THead,
  TBody,
  Tr,
  Td,
  Th
} from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { fromNamespace, toNamespace } from 'src/utils/config'
import { startCase } from 'src/utils/string'

import NotificationsCtx from '../NotificationsContext'

const channelSize = 229
const sizes = {
  balance: 152,
  transactions: 184,
  compliance: 178,
  errors: 142,
  security: 152,
  active: 263
}

const Row = ({
  namespace,
  data,
  forceDisable,
  save,
  shouldUpperCase,
  onActivation
}) => {
  const disabled = forceDisable || !data || !data.active

  const Cell = ({ name, disabled }) => {
    const value = !!(data && data[name])

    const onChange = event => {
      if (name === 'active' && value === false) {
        if (!onActivation()) return
      }

      save({ [name]: event.target.checked })
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
      <Cell name="balance" disabled={disabled} />
      <Cell name="transactions" disabled={disabled} />
      <Cell name="compliance" disabled={disabled} />
      <Cell name="errors" disabled={disabled} />
      <Cell name="security" disabled={disabled} />
      <Cell name="active" disabled={forceDisable} />
    </Tr>
  )
}

const useStyles = makeStyles({
  wizardTable: {
    width: 930
  }
})

const Setup = ({ wizard, forceDisable }) => {
  const {
    data: rawData,
    save: rawSave,
    twilioAvailable,
    setSmsSetupPopup,
    mailgunAvailable,
    setEmailSetupPopup
  } = useContext(NotificationsCtx)

  const namespaces = [
    {
      name: 'email',
      forceDisable: forceDisable,
      shouldUpperCase: false,
      onActivation: () => {
        if (mailgunAvailable) return true
        setEmailSetupPopup(true)
        return false
      }
    },
    {
      name: 'sms',
      forceDisable: forceDisable,
      shouldUpperCase: true,
      onActivation: () => {
        if (twilioAvailable) return true
        setSmsSetupPopup(true)
        return false
      }
    },
    {
      name: 'notificationCenter',
      forceDisable: forceDisable,
      shouldUpperCase: false,
      onActivation: () => true
    }
  ]

  const widthAdjust = wizard ? 20 : 0
  const classes = useStyles()
  return (
    <Table className={wizard ? classes.wizardTable : null}>
      <THead>
        <Th width={channelSize - widthAdjust}>Channel</Th>
        {Object.keys(sizes).map(it => (
          <Th key={it} width={sizes[it] - widthAdjust} textAlign="center">
            {startCase(it)}
          </Th>
        ))}
      </THead>
      <TBody>
        {namespaces.map(namespace => (
          <Row
            namespace={namespace.name}
            forceDisable={namespace.forceDisable}
            save={R.compose(rawSave(null), toNamespace(namespace.name))}
            data={fromNamespace(namespace.name)(rawData)}
            shouldUpperCase={namespace.shouldUpperCase}
            onActivation={namespace.onActivation}
          />
        ))}
      </TBody>
    </Table>
  )
}

export default Setup
