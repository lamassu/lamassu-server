import React from 'react'

import { Td, THead } from 'src/components/fake-table/Table'
import { startCase } from 'src/utils/string'

import { ACTION_COL_SIZE, DEFAULT_COL_SIZE } from './consts'

const Header = ({ elements, enableEdit, enableDelete }) => {
  const actionColSize =
    enableDelete && enableEdit ? ACTION_COL_SIZE / 2 : ACTION_COL_SIZE

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
        <Td header width={actionColSize} textAlign="right">
          Edit
        </Td>
      )}
      {enableDelete && (
        <Td header width={actionColSize} textAlign="right">
          Delete
        </Td>
      )}
    </THead>
  )
}

export default Header
