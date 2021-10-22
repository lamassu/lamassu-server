import * as R from 'ramda'
import React, { useContext } from 'react'

import {
  Td,
  THead,
  TDoubleLevelHead,
  ThDoubleLevel
} from 'src/components/fake-table/Table'
import { startCase } from 'src/utils/string'

import TableCtx from './Context'

const groupSecondHeader = elements => {
  const [toSHeader, noSHeader] = R.partition(R.has('doubleHeader'))(elements)

  if (!toSHeader.length) {
    return [elements, THead]
  }

  const index = R.indexOf(toSHeader[0], elements)
  const width = R.compose(R.sum, R.map(R.path(['width'])))(toSHeader)

  const innerElements = R.insert(
    index,
    { width, elements: toSHeader, name: toSHeader[0].doubleHeader },
    noSHeader
  )

  return [innerElements, TDoubleLevelHead]
}

const Header = () => {
  const {
    elements,
    enableEdit,
    enableEditText,
    editWidth,
    enableDelete,
    deleteWidth,
    enableToggle,
    toggleWidth,
    DEFAULT_COL_SIZE
  } = useContext(TableCtx)

  const mapElement2 = (it, idx) => {
    const { width, elements, name } = it

    if (elements && elements.length) {
      return (
        <ThDoubleLevel key={idx} width={width} title={name}>
          {elements.map(mapElement)}
        </ThDoubleLevel>
      )
    }

    return mapElement(it, idx)
  }

  const mapElement = (
    { name, width = DEFAULT_COL_SIZE, header, textAlign },
    idx
  ) => (
    <Td header key={idx} width={width} textAlign={textAlign}>
      {header || startCase(name)}
    </Td>
  )

  const [innerElements, HeaderElement] = groupSecondHeader(elements)

  return (
    <HeaderElement>
      {innerElements.map(mapElement2)}
      {enableEdit && (
        <Td header width={editWidth} textAlign="center">
          {enableEditText ?? `Edit`}
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
    </HeaderElement>
  )
}

export default Header
