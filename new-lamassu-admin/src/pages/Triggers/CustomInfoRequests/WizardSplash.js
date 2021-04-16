import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P } from 'src/components/typography'
import { ReactComponent as CustomReqLogo } from 'src/styling/icons/compliance/custom-requirement.svg'

const styles = {
  logo: {
    maxHeight: 150,
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

const WizardSplash = ({ onContinue }) => {
  const classes = useStyles()
  return (
    <div className={classes.modalContent}>
      <CustomReqLogo className={classes.logo} />
      <H1 className={classes.title}>Custom information request</H1>
      <P className={classes.text}>
        A custom information request allows you to have an extra option to ask
        specific information about your customers when adding a trigger that
        isn't an option on the default requirements list.
      </P>
      <P>
        Note that adding a custom information request isn't the same as adding
        triggers. You will still need to add a trigger with the new requirement
        to get this information from your customers.
      </P>
      <Button className={classes.button} onClick={onContinue}>
        Get started
      </Button>
    </div>
  )
}

export default WizardSplash
