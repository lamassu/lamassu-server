import { makeStyles } from '@material-ui/core'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Subtitle from 'src/components/Subtitle'

import styles from './Section.styles'

const useStyles = makeStyles(styles)

const Section = ({ error, children, title }) => {
  const classes = useStyles()
  return (
    <div className={classes.section}>
      {(title || error) && (
        <div className={classes.sectionHeader}>
          <Subtitle className={classes.sectionTitle}>{title}</Subtitle>
          {error && <ErrorMessage>Failed to save changes</ErrorMessage>}
        </div>
      )}
      {children}
    </div>
  )
}

export default Section
