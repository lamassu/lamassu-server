import React, { useState, memo } from 'react'
import classnames from 'classnames'
import { AutoSizer, List, CellMeasurer, CellMeasurerCache } from 'react-virtualized'
import { makeStyles } from '@material-ui/core/styles'

import { Table, THead, Tr, TBody, Td, Th } from '../fake-table/Table'
import { ReactComponent as ExpandClosedIcon } from '../../styling/icons/action/expand/closed.svg'
import { ReactComponent as ExpandOpenIcon } from '../../styling/icons/action/expand/open.svg'
import { mainWidth, tableHeaderHeight } from '../../styling/variables'

const styles = {
  expandButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4
  }
}

const useStyles = makeStyles(styles)

const ExpRow = ({ id, columns, details, expanded, className, expandRow, ...props }) => {
  const classes = useStyles()

  return (
    <>
      <Tr className={classnames(className)} {...props}>
        {columns.slice(0, -1).map((col, idx) => (
          <Td key={idx} size={col.size} className={col.className} textAlign={col.textAlign}>{col.value}</Td>
        ))}
        <Td size={columns[columns.length - 1].size}>
          <button onClick={() => expandRow(id)} className={classes.expandButton}>
            {expanded && <ExpandOpenIcon />}
            {!expanded && <ExpandClosedIcon />}
          </button>
        </Td>
      </Tr>
      {expanded && (
        <Tr className={classes.detailsRow}>
          <Td size={mainWidth}>
            {details}
          </Td>
        </Tr>
      )}
    </>
  )
}

/* rows = [{ columns = [{ name, value, className, textAlign, size }], details, className, error, errorMessage }]
 * Don't forget to include the size of the last (expand button) column!
 */
const ExpTable = ({ rows = [], className, ...props }) => {
  const [expanded, setExpanded] = useState(null)

  const expandRow = (id) => {
    setExpanded(id === expanded ? null : id)
  }

  if (!rows) return null

  const cache = new CellMeasurerCache({
    defaultHeight: 62,
    fixedWidth: true
  })

  function rowRenderer ({ index, isScrolling, key, parent, style }) {
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        <div style={style}>
          <ExpRow
            id={index}
            columns={rows[index].columns}
            details={rows[index].details}
            expanded={index === expanded}
            className={rows[index].className}
            expandRow={expandRow}
            error={rows[index].error}
            errorMessage={rows[index].errorMessage}
          />
        </div>
      </CellMeasurer>
    )
  }

  return (
    <>
      <div>
        <THead>
          {rows[0].columns.map((c, idx) => (
            <Th key={idx} size={c.size} className={c.className} textAlign={c.textAlign}>{c.name}</Th>
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
              rowCount={rows.length}
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
