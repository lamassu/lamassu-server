import React, { memo } from 'react'
import * as R from 'ramda'

import {
  Th,
  ThDoubleLevel,
  THead,
  TBody,
  Table,
  TDoubleLevelHead
} from 'src/components/fake-table/Table'
import { startCase } from 'src/utils/string'

import ERow from './Row'

const ETHead = memo(({ elements, className }) => {
  const action = R.last(elements)

  return (
    <THead className={className?.root}>
      {R.init(elements).map(({ name, size, display, textAlign }, idx) => (
        <Th
          id={name}
          key={idx}
          size={size}
          textAlign={textAlign}
          className={className?.cell}>
          {display}
        </Th>
      ))}
      <Th size={action.size} action>
        {startCase(action.name)}
      </Th>
    </THead>
  )
})

const ETDoubleHead = memo(({ elements, className }) => {
  const action = R.last(elements)

  return (
    <TDoubleLevelHead className={className?.root}>
      {R.init(elements).map((element, idx) => {
        if (Array.isArray(element)) {
          return (
            <ThDoubleLevel
              key={idx}
              title={element[0].display}
              className={className?.cell}>
              {R.map(({ name, size, display, textAlign }) => (
                <Th key={name} id={name} size={size} textAlign={textAlign}>
                  {display}
                </Th>
              ))(R.tail(element))}
            </ThDoubleLevel>
          )
        }

        const { name, size, display, textAlign } = element
        return (
          <Th id={idx} key={name} size={size} textAlign={textAlign}>
            {display}
          </Th>
        )
      })}
      <Th size={action.size} action>
        {startCase(action.name)}
      </Th>
    </TDoubleLevelHead>
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
    disableAction,
    className,
    double
  }) => {
    return (
      <Table className={className}>
        {!double && <ETHead elements={elements} />}
        {double && (
          <ETDoubleHead elements={elements} className={className?.head} />
        )}
        <TBody>
          {addingRow && (
            <ERow
              elements={elements}
              initialValues={initialValues}
              save={save}
              reset={reset}
              validationSchema={validationSchema}
              editing
            />
          )}
          {data.map((it, idx) => (
            <ERow
              key={idx}
              initialValues={it}
              elements={elements}
              save={save}
              reset={it => reset(it)}
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
