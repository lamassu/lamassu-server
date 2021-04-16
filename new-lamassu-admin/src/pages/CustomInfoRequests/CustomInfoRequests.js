import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React, { useState } from 'react'

import { Button } from 'src/components/buttons'
import { Info1, Info3 as Info2 } from 'src/components/typography'

import styles from './CustomInfoRequests.styles'
import Wizard from './Wizard'
const useStyles = makeStyles(styles)
const CustomInfoRequests = () => {
  const classes = useStyles()
  const [showWizard, setShowWizard] = useState(false)
  const toggleWizard = () => setShowWizard(!showWizard)
  return (
    <>
      <div className={classes.centerItems}>
        <Info1 className={classnames(classes.m0, classes.mb10)}>
          It seems you haven't added any custom information requests yet.
        </Info1>
        <Info2 className={classnames(classes.m0, classes.mb10)}>
          Please read our Support Article on Compliance before adding new
          information requests.
        </Info2>
        <Button onClick={toggleWizard}>Add custom information request</Button>
      </div>
      {showWizard && <Wizard onClose={() => setShowWizard(false)} />}
    </>
  )
}

export default CustomInfoRequests
