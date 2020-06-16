import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import { Info3, Label1 } from 'src/components/typography'

import mainStyles from '../CustomersList.styles'

const useStyles = makeStyles(mainStyles)

const Field = memo(({ label, display }) => {
  const classes = useStyles()

  return (
    <div className={classes.field}>
      <Label1>{label}</Label1>
      <Info3 className={classes.fieldDisplay}>{display}</Info3>
    </div>
  )
})

export default Field
