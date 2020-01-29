import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { HIGH_VALUE_TRANSACTION_KEY, isDisabled } from './aux.js'
import { BigNumericInput } from './Inputs'
import { localStyles } from './Notifications.styles'

const styles = R.mergeAll([commonStyles, localStyles])

const useStyles = makeStyles(styles)

const TransactionAlerts = ({
  value: setupValue,
  save,
  editingState,
  handleEditingClick
}) => {
  const classes = useStyles()

  const editing = editingState[HIGH_VALUE_TRANSACTION_KEY]

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = it => save({ [HIGH_VALUE_TRANSACTION_KEY]: it })

  const field = {
    name: 'alert',
    label: 'Alert me over',
    value: setupValue[HIGH_VALUE_TRANSACTION_KEY]
  }

  return (
    <>
      <TL1 className={classes.sectionTitle}>Transaction alerts</TL1>
      <div>
        <BigNumericInput
          title="High value transaction"
          field={field}
          editing={editing}
          disabled={isDisabled(editingState, HIGH_VALUE_TRANSACTION_KEY)}
          setEditing={handleEdit(HIGH_VALUE_TRANSACTION_KEY)}
          handleSubmit={handleSubmit}
        />
      </div>
    </>
  )
}

export default TransactionAlerts
