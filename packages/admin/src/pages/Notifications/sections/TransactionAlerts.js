import React from 'react'

import SingleFieldEditableNumber from '../components/SingleFieldEditableNumber'

const NAME = 'highValueTransaction'

const TransactionAlerts = ({ section, fieldWidth }) => {
  return (
    <SingleFieldEditableNumber
      section={section}
      title="High value transaction"
      label="Alert me over"
      name={NAME}
      width={fieldWidth}
    />
  )
}

export default TransactionAlerts
