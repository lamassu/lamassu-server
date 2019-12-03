import React, { useState } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { Table, THead, Tr, TBody, Td, Th } from '../fake-table/Table'
import { ReactComponent as ExpandClosedIcon } from '../../styling/icons/action/expand/closed.svg'
import { ReactComponent as ExpandOpenIcon } from '../../styling/icons/action/expand/open.svg'
import { mainWidth } from '../../styling/variables'

const styles = {
  hideDetailsRow: {
    display: 'none'
  },
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

  return (
    <Table className={classnames(className)}>
      <THead>
        {rows[0].columns.map((c, idx) => (
          <Th key={idx} size={c.size} className={c.className} textAlign={c.textAlign}>{c.name}</Th>
        ))}
      </THead>
      <TBody>
        {rows && rows.map((r, idx) => {
          const row = rows[idx]

          return (
            <ExpRow
              key={idx}
              id={idx}
              columns={row.columns}
              details={row.details}
              expanded={idx === expanded}
              className={row.className}
              expandRow={expandRow}
              error={row.error}
              errorMessage={row.errorMessage}
            />
          )
        })}
      </TBody>
    </Table>
  )
}

export default ExpTable
