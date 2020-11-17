import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'
import {
  AutoSizer,
  List,
  CellMeasurer,
  CellMeasurerCache
} from 'react-virtualized'

import {
  Table,
  TBody,
  THead,
  Tr,
  Td,
  Th
} from 'src/components/fake-table/Table'
import { H4 } from 'src/components/typography'
import { ReactComponent as ExpandClosedIcon } from 'src/styling/icons/action/expand/closed.svg'
import { ReactComponent as ExpandOpenIcon } from 'src/styling/icons/action/expand/open.svg'

import styles from './DataTable.styles'

const useStyles = makeStyles(styles)

const Row = ({
  id,
  elements,
  data,
  width,
  Details,
  expanded,
  expandRow,
  expWidth,
  expandable,
  onClick
}) => {
  const classes = useStyles()

  const hasPointer = onClick || expandable
  const trClasses = {
    [classes.pointer]: hasPointer,
    [classes.row]: true,
    [classes.expanded]: expanded
  }

  return (
    <div className={classes.rowWrapper}>
      <div className={classnames({ [classes.before]: expanded && id !== 0 })}>
        <Tr
          className={classnames(trClasses)}
          onClick={() => {
            expandable && expandRow(id)
            onClick && onClick(data)
          }}
          error={data.error}
          errorMessage={data.errorMessage}>
          {elements.map(({ view = it => it?.toString(), ...props }, idx) => (
            <Td key={idx} {...props}>
              {view(data)}
            </Td>
          ))}
          {expandable && (
            <Td width={expWidth} textAlign="center">
              <button
                onClick={() => expandRow(id)}
                className={classes.expandButton}>
                {expanded && <ExpandOpenIcon />}
                {!expanded && <ExpandClosedIcon />}
              </button>
            </Td>
          )}
        </Tr>
      </div>
      {expandable && expanded && (
        <div className={classes.after}>
          <Tr className={classnames({ [classes.expanded]: expanded })}>
            <Td width={width}>
              <Details it={data} />
            </Td>
          </Tr>
        </div>
      )}
    </div>
  )
}

const DataTable = ({
  elements = [],
  data = [],
  Details,
  className,
  expandable,
  initialExpanded,
  onClick,
  loading,
  emptyText,
  extraHeight,
  ...props
}) => {
  const [expanded, setExpanded] = useState(initialExpanded)

  useEffect(() => setExpanded(initialExpanded), [initialExpanded])

  const coreWidth = R.compose(R.sum, R.map(R.prop('width')))(elements)
  const expWidth = 1000 - coreWidth
  const width = coreWidth + (expandable ? expWidth : 0)

  const classes = useStyles({ width })

  const expandRow = id => {
    setExpanded(id === expanded ? null : id)
  }

  const cache = new CellMeasurerCache({
    defaultHeight: 62,
    fixedWidth: true
  })

  function rowRenderer({ index, key, parent, style }) {
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}>
        <div style={style}>
          <Row
            width={width}
            id={index}
            expWidth={expWidth}
            elements={elements}
            data={data[index]}
            Details={Details}
            expanded={index === expanded}
            expandRow={expandRow}
            expandable={expandable}
            onClick={onClick}
          />
        </div>
      </CellMeasurer>
    )
  }

  return (
    <Box display="flex" flex="1" flexDirection="column">
      <Table className={classes.table}>
        <THead>
          {elements.map(({ width, className, textAlign, header }, idx) => (
            <Th
              key={idx}
              width={width}
              className={className}
              textAlign={textAlign}>
              {header}
            </Th>
          ))}
          {expandable && <Th width={expWidth}></Th>}
        </THead>
        <TBody className={classes.body}>
          {loading && <H4>Loading...</H4>}
          {!loading && R.isEmpty(data) && <H4>{emptyText}</H4>}
          <AutoSizer disableWidth disableHeight>
            {() => (
              <List
                // this has to be in a style because of how the component works
                style={{ overflow: 'inherit', outline: 'none' }}
                {...props}
                height={data.length * 62 + extraHeight}
                width={width}
                rowCount={data.length}
                rowHeight={cache.rowHeight}
                rowRenderer={rowRenderer}
                overscanRowCount={50}
                deferredMeasurementCache={cache}
              />
            )}
          </AutoSizer>
        </TBody>
      </Table>
    </Box>
  )
}

export default DataTable
