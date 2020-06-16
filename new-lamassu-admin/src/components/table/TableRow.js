import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import typographyStyles from 'src/components/typography/styles'
import {
  tableCellColor,
  tableCellHeight,
  tableSmCellHeight,
  tableLgCellHeight,
  tableErrorColor,
  tableSuccessColor
} from 'src/styling/variables'

const { info2, p } = typographyStyles

const useStyles = makeStyles({
  tr: {
    extend: p,
    padding: 4,
    height: tableCellHeight,
    backgroundColor: tableCellColor
  },
  lg: {
    extend: info2,
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

const TableRow = memo(
  ({ className, children, header, error, success, size = 'sm', ...props }) => {
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
  }
)

export default TableRow
