import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import { Info3, Label1 } from 'src/components/typography'
import { comet } from 'src/styling/variables'

const useStyles = makeStyles({
  field: {
    height: 46
  },
  label: {
    color: comet,
    margin: [[0, 3]]
  },
  value: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
    paddingLeft: 4
  }
})

const Field = memo(({ label, display, size, className }) => {
  const classes = useStyles()

  return (
    <div
      className={classnames(classes.field, className)}
      style={{ width: size }}>
      <Label1 className={classes.label}>{label}</Label1>
      <Info3 className={classes.value}>{display}</Info3>
    </div>
  )
})

export default Field
