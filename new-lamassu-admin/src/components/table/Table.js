import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { tableHeaderColor } from '../../styling/variables'

const useStyles = makeStyles({
  table: {
    // backgroundColor: tableHeaderColor,
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: '0 0'
  }
})

const Table = memo(({ className, children, ...props }) => {
  const classes = useStyles()
  return (
    <table {...props} className={classnames(classes.table, className)}>
      {children}
    </table>
  )
})

export default Table
