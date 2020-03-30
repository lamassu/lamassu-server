import React from 'react'

import SingleFieldEditableNumber from '../components/SingleFieldEditableNumber'

const NAME = 'highValueTransaction'

const TransactionAlerts = ({ section }) => {
  return (
    <SingleFieldEditableNumber
      section={section}
      title="High value transaction"
      label="Alert me over"
      name={NAME}
    />
  )
}

export default TransactionAlerts
