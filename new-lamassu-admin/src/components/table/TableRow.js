import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import {
  tableCellColor,
  tableCellHeight,
  tableSmCellHeight,
  tableLgCellHeight,
  tableErrorColor,
  tableSuccessColor
} from '../../styling/variables'

import typographyStyles from '../typography/styles'

const { info2, p } = typographyStyles

const useStyles = makeStyles({
  tr: {
    extend: p,
    padding: 4,
    height: tableCellHeight,
    backgroundColor: tableCellColor,
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)'
  },
  lg: {
    // extend: info2,
    height: tableLgCellHeight
  },
  sm: {
    height: tableSmCellHeight
  },
  error: {
    backgroundColor: tableErrorColor
  },
  success: {
    backgroundColor: tableSuccessColor
  }
})

const TableRow = memo(({ className, children, header, error, success, size = 'sm', ...props }) => {
  const classes = useStyles()
  const classnamesObj = {
    [classes.tr]: !header,
    [classes.sm]: !header && size === 'sm',
    [classes.lg]: !header && size === 'lg',
    [classes.error]: error,
    [classes.success]: success
  }

  return (
    <tr className={classnames(classnamesObj, className)} {...props}>
      {children}
    </tr>
  )
})

export default TableRow
