import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import typographyStyles from 'src/components/typography/styles'
import {
  tableHeaderColor,
  tableHeaderHeight,
  spacer,
  white
} from 'src/styling/variables'

const { tl2 } = typographyStyles

const useStyles = makeStyles({
  th: {
    extend: tl2,
    backgroundColor: tableHeaderColor,
    height: tableHeaderHeight,
    textAlign: 'left',
    color: white,
    padding: `0 ${spacer * 3}px`
  },
  alignRight: {
    textAlign: 'right'
  }
})

const TableHeaderCell = memo(
  ({ rightAlign, children, className, ...props }) => {
    const classes = useStyles()
    const styles = {
      [classes.th]: true,
      [classes.alignRight]: rightAlign
    }

    return (
      <th {...props} className={classnames(styles, className)}>
        {children}
      </th>
    )
  }
)

export default TableHeaderCell
