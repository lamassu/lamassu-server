import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

const useStyles = makeStyles({
  table: {
    // backgroundColor: tableHeaderColor,
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: '0 0',
  },
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
