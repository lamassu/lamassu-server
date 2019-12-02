import React, { useState, useEffect } from 'react'
import { map, set } from 'lodash/fp'
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

const ExpRow = ({ id, columns, details, sizes, expanded, className, expandRow, ...props }) => {
  const classes = useStyles()

  const detailsRowClasses = {
    [classes.detailsRow]: true,
    [classes.hideDetailsRow]: !expanded
  }

  return (
    <>
      <Tr className={classnames(className)} {...props}>
        {columns.map((col, idx) => (
          <Td key={idx} size={sizes[idx]} className={col.className} textAlign={col.textAlign}>{col.value}</Td>
        ))}
        <Td size={sizes[sizes.length - 1]}>
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

/* headers = [{ value, className, textAlign }]
 * rows = [{ columns = [{ value, className, textAlign }], details, className, error, errorMessage }]
 */
const ExpTable = ({ headers = [], rows = [], sizes = [], className, ...props }) => {
  const [expanded, setExpanded] = useState(null)

  const expandRow = (id) => {
    console.log(id)
    setExpanded(id === expanded ? null : id)
  }

  return (
    <Table className={classnames(className)}>
      <THead>
        {headers.map((header, idx) => (
          <Th key={idx} size={sizes[idx]} className={header.className} textAlign={header.textAlign}>{header.value}</Th>
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
              sizes={sizes}
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
