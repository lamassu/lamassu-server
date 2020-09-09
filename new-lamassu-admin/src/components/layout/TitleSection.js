import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Title from 'src/components/Title'
import { Label1 } from 'src/components/typography'

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
      <Box display="flex" flexDirection="row">
        {(labels ?? []).map(({ icon, label }, idx) => (
          <Box key={idx} display="flex" alignItems="center">
            <div className={classes.icon}>{icon}</div>
            <Label1 className={classes.label}>{label}</Label1>
          </Box>
        ))}
      </Box>
      {children}
    </div>
  )
}

export default TitleSection
