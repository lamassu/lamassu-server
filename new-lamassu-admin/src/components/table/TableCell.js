import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { spacer } from '../../styling/variables'

const useStyles = makeStyles({
  td: {
    padding: `0 ${spacer * 3}px`
  },
  alignRight: {
    textAlign: 'right'
  }
})

const TableCell = memo(({ rightAlign, className, children, ...props }) => {
  const classes = useStyles()
  const styles = {
    [classes.td]: true,
    [classes.alignRight]: rightAlign
  }

  return (
    <td className={classnames(styles, className)} {...props}>
      {children}
    </td>
  )
})

export default TableCell
