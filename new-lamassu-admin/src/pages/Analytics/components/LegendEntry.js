import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import { P } from 'src/components/typography'

import styles from '../Analytics.styles'

const useStyles = makeStyles(styles)

const LegendEntry = ({ IconElement, IconComponent, label }) => {
  const classes = useStyles()

  return (
    <span className={classes.legendEntry}>
      {!!IconComponent && <IconComponent height={12} />}
      {!!IconElement && IconElement}
      <P>{label}</P>
    </span>
  )
}

export default LegendEntry
