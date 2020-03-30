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

const Row = ({ namespace }) => {
  const { data, save } = useContext(NotificationsCtx)
  const disabled = !data || !data[`${namespace}_active`]

  const Cell = ({ name, disabled }) => {
    const namespaced = `${namespace}_${name}`
    const value = !!(data && data[namespaced])

    return (
      <Td width={sizes[name]} textAlign="center">
        <Switch
          disabled={disabled}
          checked={value}
          onChange={event => {
            save(null, { [namespaced]: event.target.checked })
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
      <Cell name="active" />
    </Tr>
  )
}

const useStyles = makeStyles({
  mainTable: {
    width
  }
})
const Setup = () => {
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
        <Row namespace="email" />
        <Row namespace="sms" />
      </TBody>
    </Table>
  )
}

export default Setup
