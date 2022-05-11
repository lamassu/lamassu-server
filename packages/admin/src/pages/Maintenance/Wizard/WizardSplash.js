import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P, Info2 } from 'src/components/typography'
import filledCassettes from 'src/styling/icons/cassettes/both-filled.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { comet } from 'src/styling/variables'

const styles = {
  button: {
    margin: [[35, 'auto', 0, 'auto']]
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    padding: [[0, 34]]
  },
  splashTitle: {
    marginTop: 15
  },
  warningInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },
  warningIcon: {
    width: 25,
    height: 25,
    marginRight: 8,
    display: 'block'
  },
  warningText: {
    flexBasis: '100%',
    flexGrow: 1
  },
  machineName: {
    margin: [[5, 0]],
    color: comet
  }
}

const useStyles = makeStyles(styles)

const WizardSplash = ({ name, onContinue }) => {
  const classes = useStyles()

  return (
    <div className={classes.modalContent}>
      <img width="148" height="196" alt="cassette" src={filledCassettes}></img>
      <H1 className={classes.splashTitle} noMargin>
        Update counts
      </H1>
      <Info2 className={classes.machineName} noMargin>
        {name}
      </Info2>
      <div className={classes.warningInfo}>
        <WarningIcon className={classes.warningIcon} />
        <P noMargin className={classes.warningText}>
          Before updating counts on Lamassu Admin, make sure you've done it
          before on the machines.
        </P>
      </div>
      <div className={classes.warningInfo}>
        <WarningIcon className={classes.warningIcon} />
        <P noMargin className={classes.warningText}>
          For cash cassettes, please make sure you've removed the remaining
          bills before adding the new ones.
        </P>
      </div>
      <Button className={classes.button} onClick={onContinue}>
        Get started
      </Button>
    </div>
  )
}

export default WizardSplash
