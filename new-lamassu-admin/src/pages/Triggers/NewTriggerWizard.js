import React from 'react'
import { makeStyles, Paper } from '@material-ui/core'

import { H2 } from 'src/components/typography'
// import { Button } from 'src/components/buttons'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import { mainStyles } from './Triggers.styles'

const useStyles = makeStyles(mainStyles)

const NewTriggerWizard = ({ handleClose, save }) => {
  const classes = useStyles()

  return (
    <Paper className={classes.paper}>
      <button onClick={handleClose}>
        <CloseIcon />
      </button>
      <div className={classes.modalHeader}>
        <H2>New Compliance Trigger</H2>
      </div>
      <div className={classes.modalBody}></div>
    </Paper>
  )
}

export { NewTriggerWizard }
