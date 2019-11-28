import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import { tableHeaderColor, tableHeaderHeight, spacer, white } from '../../styling/variables'
import typographyStyles from '../typography/styles'

const { label2 } = typographyStyles

const useStyles = makeStyles({
  th: {
    extend: label2,
    backgroundColor: tableHeaderColor,
    height: tableHeaderHeight,
    textAlign: 'left',
    color: white,
    padding: `0 ${spacer * 3}px`
  }
})

const TableHeaderCell = memo(({ children, className, ...props }) => {
  const classes = useStyles()
  return (
    <th {...props} className={classnames(classes.th, className)}>
      {children}
    </th>
  )
})

export default TableHeaderCell
