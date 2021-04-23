import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { Button, Link } from 'src/components/buttons'
import { Info1, Info3 } from 'src/components/typography'

import styles from './CustomInfoRequests.styles'
import Wizard from './Wizard'

const useStyles = makeStyles(styles)
const CustomInfoRequests = ({ customRequests, showWizard, toggleWizard }) => {
  const classes = useStyles()

  return (
    <>
      {!customRequests.length && (
        <div className={classes.centerItems}>
          <Info1 className={classnames(classes.m0, classes.mb10)}>
            It seems you haven't added any custom information requests yet.
          </Info1>
          <Info3 className={classnames(classes.m0, classes.mb10)}>
            Please read our{' '}
            <a href="https://support.lamassu.is/hc/en-us/sections/115000817232-Compliance">
              <Link>Support Article</Link>
            </a>{' '}
            on Compliance before adding new information requests.
          </Info3>
          <Button onClick={toggleWizard}>Add custom information request</Button>
        </div>
      )}
      {showWizard && <Wizard onClose={toggleWizard} />}
    </>
  )
}

export default CustomInfoRequests
