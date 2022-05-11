import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import { spacer } from 'src/styling/variables'

const useStyles = makeStyles({
  td: {
    padding: [[0, spacer * 3]]
  },
  alignRight: {
    textAlign: 'right'
  }
})

const TableCell = memo(
  ({ colspan, rightAlign, className, children, ...props }) => {
    const classes = useStyles()
    const styles = {
      [classes.td]: true,
      [classes.alignRight]: rightAlign
    }

    return (
      <td
        colSpan={colspan}
        className={classnames(styles, className)}
        {...props}>
        {children}
      </td>
    )
  }
)

export default TableCell
