import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import { makeStyles } from '@material-ui/core'
import { useQuery, useMutation } from '@apollo/react-hooks'

import { TL1 } from 'src/components/typography'
import Title from 'src/components/Title'
import ErrorMessage from 'src/components/ErrorMessage'
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
  ADD_OVERRIDE_FBA_KEY,
  ADD_OVERRIDE_CBA_KEY,
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
  [FIAT_BALANCE_ALERTS_KEY]: {
    ...fiatBalanceAlertsInitialValues,
    [OVERRIDES_KEY]: []
  },
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
  [ADD_OVERRIDE_FBA_KEY]: false,
  [ADD_OVERRIDE_CBA_KEY]: false
}

const GET_INFO = gql`
  {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const SectionHeader = ({ error, children }) => {
  const classes = useStyles()

  return (
    <div className={classes.sectionHeader}>
      <TL1 className={classes.sectionTitle}>{children}</TL1>
      {error && <ErrorMessage>Failed to save changes</ErrorMessage>}
    </div>
  )
}

const Notifications = () => {
  const [state, setState] = useState(null)
  const [editingState, setEditingState] = useState(initialEditingState)
  const [error, setError] = useState(null)
  const [tryingToSave, setTryingToSave] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      const { notifications } = data.saveConfig
      setState(notifications)
      setEditingState(R.map(x => false, editingState))
      setTryingToSave(null)
      setError(null)
    },
    onError: e => {
      setError({ section: tryingToSave, error: e })
    }
  })
  const classes = useStyles()

  useQuery(GET_INFO, {
    onCompleted: data => {
      const { notifications } = data.config
      if (notifications) {
        const { [OVERRIDES_KEY]: machines } = notifications[
          FIAT_BALANCE_ALERTS_KEY
        ]
        const editingFiatBalanceAlertsOverrides = R.fromPairs(
          machines.map(machine => [machine.name, false])
        )
        setEditingState({
          ...editingState,
          ...editingFiatBalanceAlertsOverrides
        })
      }
      setState(notifications ?? initialValues)
    },
    fetchPolicy: 'network-only'
  })

  const save = it => {
    return saveConfig({ variables: { config: { notifications: it } } })
  }

  const handleEditingClick = (key, state) => {
    setEditingState(R.merge(editingState, { [key]: state }))
  }

  const curriedSave = R.curry((key, values) => {
    setTryingToSave(key)
    console.log(key)
    save(R.mergeDeepRight(state)({ [key]: values }))
  })

  if (!state) return null
  console.log(state)

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Notifications</Title>
        </div>
      </div>
      <div className={classes.section}>
        <SectionHeader error={error?.section === SETUP_KEY}>
          Setup
        </SectionHeader>
        <Setup values={state.setup} save={curriedSave(SETUP_KEY)} />
      </div>
      <div className={classes.section}>
        <SectionHeader error={error?.section === TRANSACTION_ALERTS_KEY}>
          Transaction alerts
        </SectionHeader>
        <TransactionAlerts
          value={state[TRANSACTION_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(TRANSACTION_ALERTS_KEY)}
          setError={setError}
        />
      </div>
      <div className={classes.section}>
        <SectionHeader error={error?.section === FIAT_BALANCE_ALERTS_KEY}>
          Fiat balance alerts
        </SectionHeader>
        <FiatBalanceAlerts
          values={state[FIAT_BALANCE_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(FIAT_BALANCE_ALERTS_KEY)}
          setError={setError}
        />
      </div>
      <div className={classes.section}>
        <SectionHeader error={error?.section === CRYPTO_BALANCE_ALERTS_KEY}>
          Crypto balance alerts
        </SectionHeader>
        <CryptoBalanceAlerts
          values={state[CRYPTO_BALANCE_ALERTS_KEY]}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(CRYPTO_BALANCE_ALERTS_KEY)}
          setError={setError}
        />
      </div>
    </>
  )
}

export default Notifications
