import { makeStyles } from '@material-ui/core'
import React from 'react'
import styles from 'src/pages/AddMachine/styles'
// import OperatorInfo from 'src/pages/OperatorInfo'

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
