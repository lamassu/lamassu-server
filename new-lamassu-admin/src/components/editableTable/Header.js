import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useContext } from 'react'

import {
  Td,
  THead,
  TDoubleLevelHead,
  ThDoubleLevel
} from 'src/components/fake-table/Table'
import { sentenceCase } from 'src/utils/string'

import TableCtx from './Context'

const styles = {
  orderedBySpan: {
    whiteSpace: 'nowrap',
    textDecoration: 'underline'
  }
}

const useStyles = makeStyles(styles)

const groupSecondHeader = elements => {
  const doubleHeader = R.prop('doubleHeader')
  const sameDoubleHeader = (a, b) => doubleHeader(a) === doubleHeader(b)
  const group = R.pipe(
    R.groupWith(sameDoubleHeader),
    R.map(group =>
      R.isNil(doubleHeader(group[0])) // No doubleHeader
        ? group
        : [
            {
              width: R.sum(R.map(R.prop('width'), group)),
              elements: group,
              name: doubleHeader(group[0])
            }
          ]
    ),
    R.reduce(R.concat, [])
  )

  return R.all(R.pipe(doubleHeader, R.isNil), elements)
    ? [elements, THead]
    : [group(elements), TDoubleLevelHead]
}

const Header = () => {
  const classes = useStyles()
  const {
    elements,
    enableEdit,
    enableEditText,
    editWidth,
    enableDelete,
    deleteWidth,
    enableToggle,
    toggleWidth,
    orderedBy,
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
  ) => {
    const orderClasses = classnames({
      [classes.orderedBySpan]:
        !R.isNil(orderedBy) && R.equals(name, orderedBy.code)
    })

    return (
      <Td header key={idx} width={width} textAlign={textAlign}>
        <span className={orderClasses}>
          {!R.isNil(header) ? header : sentenceCase(name)}
        </span>
      </Td>
    )
  }

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
