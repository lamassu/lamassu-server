import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import { makeStyles } from '@material-ui/core'
import { useQuery, useMutation } from '@apollo/react-hooks'

import Title from 'src/components/Title'
import commonStyles from 'src/pages/common.styles'

import { localStyles } from './Notifications.styles'
import Setup from './Setup'
import TransactionAlerts from './TransactionAlerts'
import {
  SETUP_KEY,
  TRANSACTION_ALERTS_KEY,
  HIGH_VALUE_TRANSACTION_KEY,
  CASH_IN_FULL_KEY,
  FIAT_BALANCE_ALERTS_KEY,
  CASH_OUT_EMPTY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  OVERRIDES_KEY,
  PERCENTAGE_KEY,
  NUMERARY_KEY,
  CRYPTO_BALANCE_ALERTS_KEY,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  ADD_OVERRIDE_KEY,
  EMAIL_KEY,
  BALANCE_KEY,
  TRANSACTIONS_KEY,
  COMPLIANCE_KEY,
  SECURITY_KEY,
  ERRORS_KEY,
  ACTIVE_KEY,
  SMS_KEY
} from './aux.js'
import FiatBalanceAlerts from './FiatBalanceAlerts'
import CryptoBalanceAlerts from './CryptoBalanceAlerts'

const fiatBalanceAlertsInitialValues = {
  [CASH_IN_FULL_KEY]: {
    [PERCENTAGE_KEY]: '',
    [NUMERARY_KEY]: ''
  },
  [CASH_OUT_EMPTY_KEY]: {
    [CASSETTE_1_KEY]: '',
    [CASSETTE_2_KEY]: ''
  }
}

const initialValues = {
  [SETUP_KEY]: {
    [EMAIL_KEY]: {
      [BALANCE_KEY]: false,
      [TRANSACTIONS_KEY]: false,
      [COMPLIANCE_KEY]: false,
      [SECURITY_KEY]: false,
      [ERRORS_KEY]: false,
      [ACTIVE_KEY]: false
    },
    [SMS_KEY]: {
      [BALANCE_KEY]: false,
      [TRANSACTIONS_KEY]: false,
      [COMPLIANCE_KEY]: false,
      [SECURITY_KEY]: false,
      [ERRORS_KEY]: false,
      [ACTIVE_KEY]: false
    }
  },
  [TRANSACTION_ALERTS_KEY]: {
    [HIGH_VALUE_TRANSACTION_KEY]: ''
  },
  [FIAT_BALANCE_ALERTS_KEY]: fiatBalanceAlertsInitialValues,
  [CRYPTO_BALANCE_ALERTS_KEY]: {
    [LOW_BALANCE_KEY]: '',
    [HIGH_BALANCE_KEY]: '',
    [OVERRIDES_KEY]: []
  }
}

const initialEditingState = {
  [HIGH_VALUE_TRANSACTION_KEY]: false,
  [CASH_IN_FULL_KEY]: false,
  [CASH_OUT_EMPTY_KEY]: false,
  [LOW_BALANCE_KEY]: false,
  [HIGH_BALANCE_KEY]: false,
  [ADD_OVERRIDE_KEY]: false
}

const GET_INFO = gql`
  {
    config
    machines {
      name
      deviceId
    }
  }
`
const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const Notifications = () => {
  const [state, setState] = useState(null)
  const [editingState, setEditingState] = useState(initialEditingState)
  const [setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      const { notifications } = data.saveConfig
      setState(notifications)
      setEditingState(R.map(x => false, editingState))
    },
    onError: e => {
      console.error(e)
      setError(e)
    }
  })
  const classes = useStyles()

  useQuery(GET_INFO, {
    onCompleted: data => {
      const { notifications } = data.config
      const { machines } = data
      initialValues[FIAT_BALANCE_ALERTS_KEY][OVERRIDES_KEY] = machines.map(
        machine => {
          return { name: machine.name, ...fiatBalanceAlertsInitialValues }
        }
      )
      const editingFiatBalanceAlertsOverrides = R.fromPairs(
        machines.map(machine => [machine.name, false])
      )
      setState(notifications ?? initialValues)
      setEditingState({ ...editingState, ...editingFiatBalanceAlertsOverrides })
    },
    fetchPolicy: 'network-only'
  })

  const save = it => {
    return saveConfig({ variables: { config: { notifications: it } } })
  }

  const handleEditingClick = (key, state) => {
    setEditingState(R.merge(editingState, { [key]: state }))
  }

  const curriedSave = R.curry((key, values) => save({ [key]: values }))

  if (!state) return null
  console.log('state', state)

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Operator information</Title>
        </div>
      </div>
      <div className={classes.section}>
        <Setup values={state.setup} save={curriedSave(SETUP_KEY)} />
      </div>
      <div className={classes.section}>
        <TransactionAlerts
          value={state[TRANSACTION_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(TRANSACTION_ALERTS_KEY)}
        />
      </div>
      <div className={classes.section}>
        <FiatBalanceAlerts
          values={state[FIAT_BALANCE_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(FIAT_BALANCE_ALERTS_KEY)}
        />
      </div>
      <div className={classes.section}>
        <CryptoBalanceAlerts
          values={state[CRYPTO_BALANCE_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(CRYPTO_BALANCE_ALERTS_KEY)}
        />
      </div>
    </>
  )
}

export default Notifications
