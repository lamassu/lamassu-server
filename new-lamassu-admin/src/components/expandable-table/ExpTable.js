import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'
import {
  AutoSizer,
  List,
  CellMeasurer,
  CellMeasurerCache
} from 'react-virtualized'

import { ReactComponent as ExpandClosedIcon } from 'src/styling/icons/action/expand/closed.svg'
import { ReactComponent as ExpandOpenIcon } from 'src/styling/icons/action/expand/open.svg'
import { mainWidth } from 'src/styling/variables'
import { THead, Tr, Td, Th } from 'src/components/fake-table/Table'

const styles = {
  expandButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4
  },
  row: {
    borderRadius: 0
  }
}

const useStyles = makeStyles(styles)

const ExpRow = ({
  id,
  elements,
  data,
  Details,
  expanded,
  expandRow,
  ...props
}) => {
  const classes = useStyles()

  return (
    <>
      <Tr
        className={classnames(classes.row)}
        error={data.error}
        errorMessage={data.errorMessage}>
        {elements
          .slice(0, -1)
          .map(
            (
              {
                header,
                size,
                className,
                textAlign,
                view = it => it?.toString()
              },
              idx
            ) => (
              <Td
                key={idx}
                size={size}
                className={className}
                textAlign={textAlign}>
                {view(data)}
              </Td>
            )
          )}
        <Td size={elements[elements.length - 1].size}>
          <button
            onClick={() => expandRow(id)}
            className={classes.expandButton}>
            {expanded && <ExpandOpenIcon />}
            {!expanded && <ExpandClosedIcon />}
          </button>
        </Td>
      </Tr>
      {expanded && (
        <Tr className={classes.detailsRow}>
          <Td size={mainWidth}>
            <Details it={data} />
          </Td>
        </Tr>
      )}
    </>
  )
}

/* rows = [{ columns = [{ name, value, className, textAlign, size }], details, className, error, errorMessage }]
 * Don't forget to include the size of the last (expand button) column!
 */
const ExpTable = ({
  elements = [],
  data = [],
  Details,
  className,
  ...props
}) => {
  const [expanded, setExpanded] = useState(null)

  const expandRow = id => {
    setExpanded(id === expanded ? null : id)
  }

  const cache = new CellMeasurerCache({
    defaultHeight: 62,
    fixedWidth: true
  })

  function rowRenderer({ index, isScrolling, key, parent, style }) {
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}>
        <div style={style}>
          <ExpRow
            id={index}
            elements={elements}
            data={data[index]}
            Details={Details}
            expanded={index === expanded}
            expandRow={expandRow}
          />
        </div>
      </CellMeasurer>
    )
  }

  return (
    <>
      <div>
        <THead>
          {elements.map(({ size, className, textAlign, header }, idx) => (
            <Th
              key={idx}
              size={size}
              className={className}
              textAlign={textAlign}>
              {header}
            </Th>
          ))}
        </THead>
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <List
              {...props}
              height={height}
              width={mainWidth}
              rowCount={data.length}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              overscanRowCount={50}
              deferredMeasurementCache={cache}
            />
          )}
        </AutoSizer>
      </div>
    </>
  )
}

export default ExpTable
