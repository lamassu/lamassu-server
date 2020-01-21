import React from 'react'
import * as R from 'ramda'

import { HIGH_VALUE_TRANSACTION_KEY, isDisabled } from './aux.js'
import { BigNumericInput } from './Inputs'

const TransactionAlerts = ({
  value: setupValue,
  save,
  editingState,
  handleEditingClick,
  setError
}) => {
  const editing = editingState[HIGH_VALUE_TRANSACTION_KEY]

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = it => save(it)

  const field = {
    name: HIGH_VALUE_TRANSACTION_KEY,
    label: 'Alert me over',
    value: setupValue[HIGH_VALUE_TRANSACTION_KEY]
  }

  return (
    <div>
      <BigNumericInput
        title="High value transaction"
        field={field}
        editing={editing}
        disabled={isDisabled(editingState, HIGH_VALUE_TRANSACTION_KEY)}
        setEditing={handleEdit(HIGH_VALUE_TRANSACTION_KEY)}
        handleSubmit={handleSubmit}
        setError={setError}
      />
    </div>
  )
}

export default TransactionAlerts
