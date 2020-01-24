import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import { makeStyles } from '@material-ui/core'
import { useQuery, useMutation } from '@apollo/react-hooks'

import Title from 'src/components/Title'
import { TL1 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'

import { localStyles } from './Notifications.styles'
import Setup from './Setup'
import TransactionAlerts from './TransactionAlerts'
import { SETUP_KEY, HIGH_VALUE_TRANSACTION_KEY } from './aux.js'

const initialValues = {
  [SETUP_KEY]: {
    email: {
      balance: false,
      transactions: false,
      compliance: false,
      security: false,
      errors: false,
      active: false
    },
    sms: {
      balance: false,
      transactions: false,
      compliance: false,
      security: false,
      errors: false,
      active: false
    }
  },
  [HIGH_VALUE_TRANSACTION_KEY]: ''
}

const initialEditingState = {
  [HIGH_VALUE_TRANSACTION_KEY]: false
}

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_CONFIG = gql`
  {
    config
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
    onError: e => setError(e)
  })
  const classes = useStyles()

  useQuery(GET_CONFIG, {
    onCompleted: data => {
      const { notifications } = data.config
      setState(notifications ?? initialValues)
    }
  })

  const save = it => {
    return saveConfig({ variables: { config: { notifications: it } } })
  }

  const handleEditingClick = (key, state) => {
    setEditingState(R.merge(editingState, { [key]: state }))
  }

  const curriedSave = R.curry((key, values) =>
    save(R.merge(state, { [key]: values }))
  )

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
          value={state.highValueTransaction}
          editingState={editingState}
          handleEditingClick={handleEditingClick}
          save={curriedSave(HIGH_VALUE_TRANSACTION_KEY)}
        />
      </div>
      <div className={classes.section}>
        <TL1 className={classes.sectionTitle}>Fiat balance alerts</TL1>
      </div>
      <div className={classes.section}>
        <TL1 className={classes.sectionTitle}>Crypto balance alerts</TL1>
      </div>
    </>
  )
}

export default Notifications
