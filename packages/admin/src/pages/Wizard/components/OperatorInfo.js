import { makeStyles } from '@material-ui/core'
import React from 'react'
// import OperatorInfo from 'src/pages/OperatorInfo'

import styles from 'src/pages/AddMachine/styles'

const useStyles = makeStyles(styles)

function WizardOperatorInfo() {
  const classes = useStyles()

  return (
    <div className={classes.wrapper}>
      {/* <OperatorInfo wizard={true}></OperatorInfo> */}
    </div>
  )
}

export default WizardOperatorInfo
