import { makeStyles } from '@material-ui/core'
import React from 'react'

import Title from 'src/components/Title'

import styles from './TitleSection.styles'

const useStyles = makeStyles(styles)

const TitleSection = ({ title }) => {
  const classes = useStyles()
  return (
    <div className={classes.titleWrapper}>
      <div className={classes.titleAndButtonsContainer}>
        <Title>{title}</Title>
      </div>
    </div>
  )
}

export default TitleSection
