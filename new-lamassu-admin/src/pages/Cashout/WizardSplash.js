import React from 'react'
import { makeStyles } from '@material-ui/core'

import { H1, P } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import { neon, spacer } from 'src/styling/variables'

const styles = {
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    margin: [[40, 0, 24]],
    '& > svg': {
      maxHeight: '100%',
      width: '100%'
    }
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: [[0, 66]],
    '& > h1': {
      color: neon,
      margin: [[spacer * 8, 0, 32]]
    },
    '& > p': {
      margin: 0
    },
    '& > button': {
      margin: [['auto', 0, 56]],
      '&:active': {
        margin: [['auto', 0, 56]]
      }
    }
  }
}

const useStyles = makeStyles(styles)

const WizardSplash = ({ handleModalNavigation, machine }) => {
  const classes = useStyles()

  return (
    <div className={classes.modalContent}>
      <H1>Enable cash-out</H1>
      <P>
        You are about to activate cash-out functionality on your {machine.name}{' '}
        machine which will allow your customers to sell crypto to you.
        <br />
        <br />
        In order to activate cash-out for this machine, please enter the
        denominations for the machine.
      </P>
      <Button onClick={() => handleModalNavigation(1)}>
        Start configuration
      </Button>
    </div>
  )
}

export default WizardSplash
