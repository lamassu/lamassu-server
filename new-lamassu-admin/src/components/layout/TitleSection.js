import { makeStyles } from '@material-ui/core'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Title from 'src/components/Title'

import styles from './TitleSection.styles'

const useStyles = makeStyles(styles)

const TitleSection = ({ title, error, labels }) => {
  const classes = useStyles()
  return (
    <div className={classes.titleWrapper}>
      <div className={classes.titleAndButtonsContainer}>
        <Title>{title}</Title>
        {error && (
          <ErrorMessage className={classes.error}>Failed to save</ErrorMessage>
        )}
      </div>
      <div className={classes.headerLabels}>{labels}</div>
    </div>
  )
}

export default TitleSection
