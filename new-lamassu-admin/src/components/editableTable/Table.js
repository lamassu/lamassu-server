import React, { memo } from 'react'
import * as R from 'ramda'

import { Td, THead, TBody, Table } from 'src/components/fake-table/Table'
import { startCase } from 'src/utils/string'

import ERow from './Row'

const ETHead = memo(({ elements }) => {
  const action = R.last(elements)

  return (
    <THead>
      {R.init(elements).map(({ name, size, display, textAlign }, idx) => (
        <Td id={name} key={idx} size={size} textAlign={textAlign} header>
          {display}
        </Td>
      ))}
      <Td header size={action.size}>
        {startCase(action.name)}
      </Td>
    </THead>
  )
})

const ETable = memo(
  ({
    elements = [],
    data = [],
    save,
    reset,
    action,
    initialValues,
    validationSchema,
    editing,
    addingRow,
    disableAction
  }) => {
    return (
      <Table>
        <ETHead elements={elements} />
        <TBody>
          {addingRow && (
            <ERow
              elements={elements}
              value={initialValues}
              save={save}
              reset={reset}
              validationSchema={validationSchema}
              editing
            />
          )}
          {data.map((it, idx) => (
            <ERow
              key={idx}
              value={it}
              elements={elements}
              save={save}
              reset={reset}
              action={action}
              validationSchema={validationSchema}
              disableAction={disableAction}
              editing={editing[idx]}
            />
          ))}
        </TBody>
      </Table>
    )
  }
)

export default ETable
