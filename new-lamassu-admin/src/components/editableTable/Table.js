import React from 'react'
import { startCase } from 'lodash/fp'

import {
  Td,
  THead,
  TBody,
  Table
} from '../fake-table/Table'

import ERow from './Row'

const ETable = ({ elements = [], data = [], cancel, save, components = {} }) => {
  const { row } = components
  const Row = row || ERow

  return (
    <Table>
      <THead>
        {elements.map(({ name, size, header }, idx) => (
          <Td header key={idx} size={size}>{header || startCase(name)}</Td>
        ))}
        <Td header size={175} />
      </THead>
      <TBody>
        {data.map((it, idx) => <Row key={idx} value={it} elements={elements} cancel={cancel} save={save} />)}
      </TBody>
    </Table>
  )
}

export default ETable
