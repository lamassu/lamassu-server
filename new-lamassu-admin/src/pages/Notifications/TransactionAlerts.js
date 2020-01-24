import React, { useState } from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { NumericInput } from './Alerts'
import { localStyles } from './Notifications.styles'

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const TransactionAlerts = ({ values: setupValues, save }) => {
  const classes = useStyles()
  const [editing, setEditing] = useState(false)
  const [disabled, setDisabled] = useState(false)

  // const saveSetup = R.curry((key, values) =>
  //   save(R.merge(setupValues, { [key]: values }))
  // )

  return (
    <>
      <TL1 className={classes.sectionTitle}>Transaction alerts</TL1>
      <div>
        <NumericInput editing={editing} disabled={disabled} />
      </div>
      <div style={{ marginTop: 50 }}>
        <button onClick={() => setEditing(!editing)}>
          {editing ? 'Stop' : 'Edit'}
        </button>
        <button onClick={() => setDisabled(!disabled)}>
          {disabled ? 'Enable' : 'Disable'}
        </button>
      </div>
    </>
  )
}

export default TransactionAlerts
