import React, { useState } from 'react'
import { identity } from 'lodash/fp'
import { FastField } from 'formik'

import {
  Td,
  Tr
} from '../fake-table/Table'

import { Link } from '../buttons'

const getField = (name, component, props = {}) => (
  <FastField name={name} component={component} {...props} />
)

const ERow = ({ elements, cancel, save, value }) => {
  const [editing, setEditing] = useState(false)
  const innerCancel = () => {
    setEditing(false)
    cancel()
  }

  return (
    <Tr>
      {elements.map(({ name, input, size, view = identity, inputProps }, idx) => (
        <Td key={idx} size={size}>
          {editing ? getField(name, input, inputProps) : view(value[name])}
        </Td>
      ))}
      <Td size={175}>
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

export default ERow
