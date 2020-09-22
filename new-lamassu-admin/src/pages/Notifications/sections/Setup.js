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

const channelSize = 129
const sizes = {
  balance: 152,
  transactions: 184,
  compliance: 178,
  errors: 142,
  active: 263
}
const width = R.sum(R.values(sizes)) + channelSize

const Row = ({ namespace, forceDisable }) => {
  const { data: rawData, save: rawSave } = useContext(NotificationsCtx)

  const save = R.compose(rawSave(null), toNamespace(namespace))
  const data = fromNamespace(namespace)(rawData)

  const disabled = forceDisable || !data || !data.active

  const Cell = ({ name, disabled }) => {
    const value = !!(data && data[name])

    return (
      <Td width={sizes[name]} textAlign="center">
        <Switch
          disabled={disabled}
          checked={value}
          onChange={event => {
            save({ [name]: event.target.checked })
          }}
          value={value}
        />
      </Td>
    )
  }

  return (
    <Tr>
      <Td width={channelSize}>{startCase(namespace)}</Td>
      <Cell name="balance" disabled={disabled} />
      <Cell name="transactions" disabled={disabled} />
      <Cell name="compliance" disabled={disabled} />
      <Cell name="errors" disabled={disabled} />
      <Cell name="active" disabled={forceDisable} />
    </Tr>
  )
}

const useStyles = makeStyles({
  mainTable: {
    width
  }
})
const Setup = ({ forceDisable }) => {
  const classes = useStyles()
  return (
    <Table className={classes.mainTable}>
      <THead>
        <Th width={channelSize}>Channel</Th>
        {Object.keys(sizes).map(it => (
          <Th key={it} width={sizes[it]} textAlign="center">
            {startCase(it)}
          </Th>
        ))}
      </THead>
      <TBody>
        <Row namespace="email" forceDisable={forceDisable} />
        <Row namespace="sms" forceDisable={forceDisable} />
      </TBody>
    </Table>
  )
}

export default Setup
