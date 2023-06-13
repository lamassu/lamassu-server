import * as R from 'ramda'
import React from 'react'

import { fromNamespace } from 'src/utils/config'

import SingleFieldEditableNumber from '../components/SingleFieldEditableNumber'

const TransactionAlerts = ({ fieldWidth, data, saveTransactionAlerts }) => {
  const { config, notificationSettings } = data
  const currencyCode = fromNamespace('locale')(config).fiatCurrency
  const eventName = 'transactionValue'
  const value = R.find(it => it.event === eventName && R.isNil(it.overrideId))(
    notificationSettings
  )

  const save = obj => saveTransactionAlerts({ variables: obj })

  return (
    <SingleFieldEditableNumber
      title="High value transaction"
      label="Alert me over"
      width={fieldWidth}
      value={value}
      valueField={'upperBound'}
      suffix={currencyCode}
      save={save}
    />
  )
}

export default TransactionAlerts
