import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P } from 'src/components/typography'

const styles = {
  logo: {
    maxHeight: 80,
    maxWidth: 200
  },
  title: {
    margin: [[24, 0, 32, 0]]
  },
  text: {
    margin: 0
  },
  button: {
    marginTop: 'auto',
    marginBottom: 58
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: [[0, 42]],
    flex: 1
  }
}

const useStyles = makeStyles(styles)

const WizardSplash = ({ name, onContinue }) => {
  const classes = useStyles()

  return (
    <div className={classes.modalContent}>
      <H1 className={classes.title}>Enable cash-out</H1>
      <P className={classes.text}>
        You are about to activate cash-out functionality on your {name} machine
        which will allow your customers to sell crypto to you.
        <br />
        In order to activate cash-out for this machine, please enter the
        denominations for the machine.
      </P>
      <Button className={classes.button} onClick={onContinue}>
        Start configuration
      </Button>
    </div>
  )
}

export default WizardSplash
