import { makeStyles } from '@material-ui/core'
import React, { useEffect } from 'react'

import styles from 'src/pages/AddMachine/styles'
import OperatorInfo from 'src/pages/OperatorInfo/OperatorInfo'

const useStyles = makeStyles(styles)

function WizardOperatorInfo({ dispatch, namespace }) {
  const classes = useStyles()
  useEffect(() => {
    dispatch({ type: 'wizard/SET_STEP', payload: namespace })
  }, [dispatch, namespace])

  return (
    <div className={classes.wrapper}>
      <OperatorInfo wizard={true}></OperatorInfo>
    </div>
  )
}

export default WizardOperatorInfo
