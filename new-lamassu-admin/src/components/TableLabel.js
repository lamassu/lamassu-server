import React from 'react'
import classnames from 'classnames'

import { Label1 } from './typography'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center'
  },
  colorIndicator: {
    borderRadius: 3,
    height: 12,
    width: 12,
    marginRight: 8
  }
})

const TableLabel = ({ className, label, color, ...props }) => {
  const classes = useStyles()
  return (
    <div className={classnames(classes.wrapper, className)} {...props}>
      {color && <div className={classes.colorIndicator} style={{ backgroundColor: color }} />}
      <Label1 {...props}>{label}</Label1>
    </div>
  )
}

export default TableLabel
