import React, { useContext } from 'react'

import { Td, THead } from 'src/components/fake-table/Table'
import { startCase } from 'src/utils/string'

import TableCtx from './Context'

const Header = () => {
  const {
    elements,
    enableEdit,
    editWidth,
    enableDelete,
    deleteWidth,
    enableToggle,
    toggleWidth,
    DEFAULT_COL_SIZE
  } = useContext(TableCtx)
  return (
    <THead>
      {elements.map(
        ({ name, width = DEFAULT_COL_SIZE, header, textAlign }, idx) => (
          <Td header key={idx} width={width} textAlign={textAlign}>
            {header || startCase(name)}
          </Td>
        )
      )}
      {enableEdit && (
        <Td header width={editWidth} textAlign="center">
          Edit
        </Td>
      )}
      {enableDelete && (
        <Td header width={deleteWidth} textAlign="center">
          Delete
        </Td>
      )}
      {enableToggle && (
        <Td header width={toggleWidth} textAlign="center">
          Enable
        </Td>
      )}
    </THead>
  )
}

export default Header
