import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { BigPercentageAndNumericInput } from './Alerts'
import { localStyles } from './Notifications.styles'
import { CASH_IN_FULL_KEY, isDisabled } from './aux'

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const FiatBalanceAlerts = ({
  values: setupValues,
  save,
  editingState,
  handleEditingClick
}) => {
  const classes = useStyles()

  const getValue = R.path(R.__, setupValues)
  const handleEdit = R.curry(handleEditingClick)
  const handleSubmit = R.curry((key, it) => {
    const setup = setupValues[key]
    const split = R.mapObjIndexed((num, k, obj) => {
      return [R.split('-', k)[1], num]
    }, it)
    const rightKeys = R.fromPairs(R.values(split))
    save({ [key]: R.merge(setup, rightKeys) })
  })

  const cashInFields = {
    percentage: {
      name: CASH_IN_FULL_KEY + '-percentage',
      label: 'Alert me over',
      value: getValue([CASH_IN_FULL_KEY, 'percentage'])
    },
    numeric: {
      name: CASH_IN_FULL_KEY + '-numeric',
      label: 'Or',
      value: getValue([CASH_IN_FULL_KEY, 'numeric'])
    }
  }

  const cashInEditing = editingState[CASH_IN_FULL_KEY]

  return (
    <>
      <TL1 className={classes.sectionTitle}>Fiat balance alerts</TL1>
      <div>
        <BigPercentageAndNumericInput
          title="Cash-in (Full)"
          fields={cashInFields}
          editing={cashInEditing}
          disabled={isDisabled(editingState, CASH_IN_FULL_KEY)}
          setEditing={handleEdit(CASH_IN_FULL_KEY)}
          handleSubmit={handleSubmit(CASH_IN_FULL_KEY)}
        />
        {/* <BigPercentageOrNumericInput
          title="Cash-in (Full)"
          field={field}
          editing={editing}
          disabled={disabled}
          setEditing={handleEdit(HIGH_VALUE_TRANSACTION_KEY)}
          handleSubmit={save}
        /> */}
      </div>
    </>
  )
}

export default FiatBalanceAlerts
