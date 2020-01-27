import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { BigPercentageAndNumericInput, MultiplePercentageInput } from './Alerts'
import { localStyles, fiatBalanceAlertsStyles } from './Notifications.styles'
import {
  CASH_IN_FULL_KEY,
  isDisabled,
  CASH_OUT_EMPTY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY
} from './aux'

const styles = R.mergeAll([commonStyles, localStyles, fiatBalanceAlertsStyles])

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

  const cashOutFields = [
    {
      title: 'Cassette 1 (Top)',
      name: CASH_OUT_EMPTY_KEY + '-' + CASSETTE_1_KEY,
      label: 'Alert me at',
      value: getValue([CASH_OUT_EMPTY_KEY, CASSETTE_1_KEY])
    },
    {
      title: 'Cassette 2',
      name: CASH_OUT_EMPTY_KEY + '-' + CASSETTE_2_KEY,
      label: 'Alert me at',
      value: getValue([CASH_OUT_EMPTY_KEY, CASSETTE_2_KEY])
    }
  ]

  const cashInEditing = editingState[CASH_IN_FULL_KEY]
  const cashOutEditing = editingState[CASH_OUT_EMPTY_KEY]

  return (
    <>
      <TL1 className={classes.sectionTitle}>Fiat balance alerts</TL1>
      <div className={classes.body}>
        <div>
          <BigPercentageAndNumericInput
            title="Cash-in (Full)"
            fields={cashInFields}
            editing={cashInEditing}
            disabled={isDisabled(editingState, CASH_IN_FULL_KEY)}
            setEditing={handleEdit(CASH_IN_FULL_KEY)}
            handleSubmit={handleSubmit(CASH_IN_FULL_KEY)}
          />
        </div>
        <div>
          <MultiplePercentageInput
            title="Cash-out (Empty)"
            fields={cashOutFields}
            editing={cashOutEditing}
            disabled={isDisabled(editingState, CASH_OUT_EMPTY_KEY)}
            setEditing={handleEdit(CASH_OUT_EMPTY_KEY)}
            handleSubmit={handleSubmit(CASH_OUT_EMPTY_KEY)}
          />
        </div>
      </div>
    </>
  )
}

export default FiatBalanceAlerts
