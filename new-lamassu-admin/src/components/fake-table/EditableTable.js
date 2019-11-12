import React, { useState } from 'react'

import {
  Td,
  Tr,
  THead,
  TBody,
  Table
} from './Table'

import { Link } from '../../components/buttons'

const EditableRow = ({ elements, cancel, save }) => {
  const [editing, setEditing] = useState(false)
  const innerCancel = () => {
    setEditing(false)
    cancel()
  }

  return (
    <Tr>
      {elements.map(({ size, edit, view }, idx) => (
        <Td key={idx} size={size}>{editing ? edit : view}</Td>
      ))}
      <Td>
        {editing ? (
          <>
            <Link style={{ marginRight: '20px' }} color='secondary' onClick={innerCancel}>
              Cancel
            </Link>
            <Link color='primary' onClick={save}>
              Save
            </Link>
          </>
        ) : (
          <Link color='primary' onClick={() => setEditing(true)}>
            Edit
          </Link>
        )}
      </Td>
    </Tr>
  )
}

const EditableTable = ({ elements = [], data = [], cancel, save }) => {
  return (
    <Table>
      <THead>
        {elements.map(({ size, header }, idx) => (
          <Td header key={idx} size={size}>{header}</Td>
        ))}
      </THead>
      <TBody>
        {data.map((it, idx) => <EditableRow key={idx} elements={elements} cancel={cancel} save={save} />)}
      </TBody>
    </Table>
  )
}

export default EditableTable
