import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Title from 'src/components/Title'

import styles from './TitleSection.styles'

const useStyles = makeStyles(styles)

const TitleSection = ({ className, title, error, labels, children }) => {
  const classes = useStyles()
  return (
    <div className={classnames(classes.titleWrapper, className)}>
      <div className={classes.titleAndButtonsContainer}>
        <Title>{title}</Title>
        {error && (
          <ErrorMessage className={classes.error}>Failed to save</ErrorMessage>
        )}
      </div>
      <div className={classes.headerLabels}>{labels}</div>
      {children}
    </div>
  )
}

export default TitleSection
