import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import Title from 'src/components/Title'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const Triggers = () => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Compliance Triggers</Title>
        </div>
      </div>
    </>
  )
}

export default Triggers
