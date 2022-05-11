import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P } from 'src/components/typography'
import { comet } from 'src/styling/variables'

const styles = {
  welcome: {
    textAlign: 'center',
    paddingTop: 256
  },
  title: {
    lineHeight: 1,
    fontSize: 48
  },
  getStarted: {
    fontSize: 24,
    fontWeight: 500,
    marginBottom: 54,
    color: comet
  }
}

const useStyles = makeStyles(styles)

function Welcome({ doContinue }) {
  const classes = useStyles()

  return (
    <div className={classes.welcome}>
      <H1 className={classes.title}>Welcome to the Lamassu Admin</H1>
      <P className={classes.getStarted}>
        To get you started, we’ve put together a wizard that will
        <br />
        help set up what you need before pairing your machines.
      </P>
      <Button size="xl" onClick={doContinue}>
        Get started
      </Button>
    </div>
  )
}

export default Welcome
