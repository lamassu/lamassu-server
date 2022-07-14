import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Label1 } from '../typography'

import styles from './HorizontalSeparator.styles'

const useStyles = makeStyles(styles)

const HorizontalSeparator = ({ title }) => {
  const classes = useStyles()
  return (
    <div className={classes.separator}>
      <Label1>{title}</Label1>
    </div>
  )
}

export default HorizontalSeparator
