import { makeStyles } from '@material-ui/core'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import { TL1 } from 'src/components/typography'

import styles from './Section.styles'

const useStyles = makeStyles(styles)

const Section = ({ error, children, title }) => {
  const classes = useStyles()
  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader}>
        <TL1 className={classes.sectionTitle}>{title}</TL1>
        {error && <ErrorMessage>Failed to save changes</ErrorMessage>}
      </div>
      {children}
    </div>
  )
}

export default Section
