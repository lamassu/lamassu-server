import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { HIGH_VALUE_TRANSACTION_KEY } from './aux.js'
import { BigNumericInput } from './Alerts'
import { localStyles } from './Notifications.styles'

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const TransactionAlerts = ({
  value: setupValue,
  save,
  editingState,
  handleEditingClick
}) => {
  const classes = useStyles()

  const editing = editingState[HIGH_VALUE_TRANSACTION_KEY]
  const disabled = R.any(
    x => x === true,
    R.values(R.omit([HIGH_VALUE_TRANSACTION_KEY], editingState))
  )

  const handleEdit = R.curry(handleEditingClick)

  const field = {
    name: 'alert',
    label: 'Alert me over',
    value: setupValue
  }

  return (
    <>
      <TL1 className={classes.sectionTitle}>Transaction alerts</TL1>
      <div>
        <BigNumericInput
          title="High value transaction"
          field={field}
          editing={editing}
          disabled={disabled}
          setEditing={handleEdit(HIGH_VALUE_TRANSACTION_KEY)}
          handleSubmit={save}
        />
      </div>
    </>
  )
}

export default TransactionAlerts
