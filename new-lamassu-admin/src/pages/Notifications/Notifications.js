/* eslint-disable no-unused-vars */
import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { P } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import twilioSchema from 'src/pages/Services/schemas/twilio'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import Section from '../../components/layout/Section'
import mailgunSchema from '../Services/schemas/mailgun'

import NotificationsCtx from './NotificationsContext'
import CryptoBalanceAlerts from './sections/CryptoBalanceAlerts'
import CryptoBalanceOverrides from './sections/CryptoBalanceOverrides'
import FiatBalanceAlerts from './sections/FiatBalanceAlerts'
import FiatBalanceOverrides from './sections/FiatBalanceOverrides'
import Setup from './sections/Setup'
import TransactionAlerts from './sections/TransactionAlerts'

const GET_INFO = gql`
  query getData {
    config
    machines {
      name
      deviceId
      numberOfCassettes
      numberOfStackers
    }
    cryptoCurrencies {
      code
      display
    }
    notificationChannelPreferences {
      channel
      active
    }
    notificationPreferences {
      event
      category
      channel
      active
    }
    notificationSettings {
      event
      overrideId
      value
    }
    accounts
  }
`

const GET_SETUP_AND_TX_ALERTS = gql`
  query getSetupAndTxAlerts {
    config
    notificationChannelPreferences {
      channel
      active
    }
    notificationPreferences {
      event
      category
      channel
      active
    }
    notificationSettings {
      event
      overrideId
      value
    }
    accounts
  }
`

const GET_FIAT_BALANCE_ALERTS = gql`
  query getFiatBalanceAlerts {
    config
    notificationSettings {
      event
      overrideId
      value
    }
    machines {
      name
      deviceId
      numberOfCassettes
      numberOfStackers
      model
    }
  }
`

const GET_CRYPTO_BALANCE_ALERTS = gql`
  query getCryptoBalanceAlerts {
    config
    notificationSettings {
      event
      overrideId
      value
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const DISABLE_NOTIFICATION_CHANNEL = gql`
  mutation disableChannel($channelName: String) {
    deactivateNotificationsByChannel(channelName: $channelName)
  }
`

const ENABLE_NOTIFICATION_CHANNEL = gql`
  mutation enableChannel($channelName: String) {
    activateNotificationsByChannel(channelName: $channelName)
  }
`

const DISABLE_NOTIFICATION_CATEGORY_BY_CHANNEL = gql`
  mutation disableCategoryByChannel(
    $categoryName: String
    $channelName: String
  ) {
    deactivateNotificationsByCategoryAndChannel(
      categoryName: $categoryName
      channelName: $channelName
    )
  }
`

const ENABLE_NOTIFICATION_CATEGORY_BY_CHANNEL = gql`
  mutation enableCategoryByChannel(
    $categoryName: String
    $channelName: String
  ) {
    activateNotificationsByCategoryAndChannel(
      categoryName: $categoryName
      channelName: $channelName
    )
  }
`

const SAVE_NOTIFICATION_SETTING = gql`
  mutation saveNotificationSetting(
    $event: NotificationEvent
    $overrideId: ID
    $value: JSONObject
  ) {
    saveNotificationSetting(
      event: $event
      overrideId: $overrideId
      value: $value
    )
  }
`

const DELETE_NOTIFICATION_SETTING = gql`
  mutation deleteNotificationSetting(
    $event: NotificationEvent
    $overrideId: ID
  ) {
    deleteNotificationSetting(event: $event, overrideId: $overrideId)
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const FIELDS_WIDTH = 130

const SetupAndTransactions = () => {
  const [smsSetupPopup, setSmsSetupPopup] = useState(false)
  const [emailSetupPopup, setEmailSetupPopup] = useState(false)
  const [txAlertError, setTxAlertError] = useState(null)
  const [setupError, setSetupError] = useState(null)

  const { data, loading } = useQuery(GET_SETUP_AND_TX_ALERTS)
  const {
    config,
    notificationChannelPreferences,
    notificationPreferences,
    notificationSettings,
    accounts
  } = !loading && data

  const twilioAvailable = R.has('twilio', accounts || {})
  const mailgunAvailable = R.has('mailgun', accounts || {})

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => {
      setSmsSetupPopup(false)
      setEmailSetupPopup(false)
    },
    refetchQueries: ['getSetupAndTxAlerts'],
    onError: error => setSetupError(error)
  })

  const [enableChannel] = useMutation(ENABLE_NOTIFICATION_CHANNEL, {
    onCompleted: () => {
      setSmsSetupPopup(false)
      setEmailSetupPopup(false)
    },
    refetchQueries: ['getSetupAndTxAlerts'],
    onError: error => setSetupError(error)
  })

  const [disableChannel] = useMutation(DISABLE_NOTIFICATION_CHANNEL, {
    onCompleted: () => {
      setSmsSetupPopup(false)
      setEmailSetupPopup(false)
    },
    refetchQueries: ['getSetupAndTxAlerts'],
    onError: error => setSetupError(error)
  })

  const [enableCategoryByChannel] = useMutation(
    ENABLE_NOTIFICATION_CATEGORY_BY_CHANNEL,
    {
      onCompleted: () => {
        setSmsSetupPopup(false)
        setEmailSetupPopup(false)
      },
      refetchQueries: ['getSetupAndTxAlerts'],
      onError: error => setSetupError(error)
    }
  )

  const [disableCategoryByChannel] = useMutation(
    DISABLE_NOTIFICATION_CATEGORY_BY_CHANNEL,
    {
      onCompleted: () => {
        setSmsSetupPopup(false)
        setEmailSetupPopup(false)
      },
      refetchQueries: ['getSetupAndTxAlerts'],
      onError: error => setSetupError(error)
    }
  )

  const [saveTransactionAlerts] = useMutation(SAVE_NOTIFICATION_SETTING, {
    onCompleted: () => {
      setSmsSetupPopup(false)
      setEmailSetupPopup(false)
    },
    refetchQueries: ['getSetupAndTxAlerts'],
    onError: error => setTxAlertError(error)
  })

  const twilioSave = it => {
    setSetupError(null)
    return saveAccount({
      variables: { accounts: { twilio: it } }
    })
  }

  const mailgunSave = it => {
    setSetupError(null)
    return saveAccount({
      variables: { accounts: { mailgun: it } }
    })
  }

  const turnOffToggle = obj => {
    if (R.isNil(obj.categoryName)) disableChannel({ variables: obj })
    return disableCategoryByChannel({ variables: obj })
  }

  const turnOnToggle = obj => {
    if (R.isNil(obj.categoryName)) return enableChannel({ variables: obj })
    return enableCategoryByChannel({ variables: obj })
  }

  return (
    !loading && (
      <>
        <Section title="Setup" error={setupError}>
          <Setup
            twilioAvailable={twilioAvailable}
            mailgunAvailable={mailgunAvailable}
            setSmsSetupPopup={setSmsSetupPopup}
            setEmailSetupPopup={setEmailSetupPopup}
            notificationPreferences={notificationPreferences}
            notificationChannelPreferences={notificationChannelPreferences}
            turnOffToggle={turnOffToggle}
            turnOnToggle={turnOnToggle}
          />
        </Section>
        <Section title="Transaction alerts" error={txAlertError}>
          <TransactionAlerts
            fieldWidth={FIELDS_WIDTH}
            data={{ config, notificationSettings }}
            saveTransactionAlerts={saveTransactionAlerts}
          />
        </Section>
        {smsSetupPopup && (
          <Modal
            title={`Configure Twilio`}
            width={478}
            handleClose={() => setSmsSetupPopup(false)}
            open={true}>
            <P>
              In order for the SMS notifications to work, you'll first need to
              configure Twilio.
            </P>
            <FormRenderer
              save={twilioSave}
              elements={twilioSchema.elements}
              validationSchema={twilioSchema.getValidationSchema}
            />
          </Modal>
        )}
        {emailSetupPopup && (
          <Modal
            title={`Configure Mailgun`}
            width={478}
            handleClose={() => setEmailSetupPopup(false)}
            open={true}>
            <P>
              In order for the mail notifications to work, you'll first need to
              configure Mailgun.
            </P>
            <FormRenderer
              save={mailgunSave}
              elements={mailgunSchema.elements}
              validationSchema={mailgunSchema.getValidationSchema}
            />
          </Modal>
        )}
      </>
    )
  )
}

const FiatBalance = () => {
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(null)
  const { data, loading } = useQuery(GET_FIAT_BALANCE_ALERTS)

  const { config, machines, notificationSettings } = !loading && data

  const [saveTransactionAlerts] = useMutation(SAVE_NOTIFICATION_SETTING, {
    refetchQueries: ['getFiatBalanceAlerts'],
    onError: error => setError(error)
  })

  const [deleteOverride] = useMutation(DELETE_NOTIFICATION_SETTING, {
    refetchQueries: ['getFiatBalanceAlerts'],
    onError: error => setError(error)
  })

  const _saveTransactionAlerts = obj =>
    saveTransactionAlerts({ variables: obj })

  const deleteEntry = (event, overrideId) =>
    deleteOverride({ variables: { event, overrideId } })

  return (
    !loading && (
      <>
        <Section title="Fiat balance alerts" error={error}>
          <FiatBalanceAlerts
            max={100}
            fieldWidth={50}
            data={{
              notificationSettings: R.filter(it => R.isNil(it.overrideId))(
                notificationSettings
              )
            }}
            save={_saveTransactionAlerts}
            error={error}
            editing={editing}
            setEditing={setEditing}
          />
          <FiatBalanceOverrides
            data={{
              config,
              machines,
              notificationSettings: R.filter(it => !R.isNil(it.overrideId))(
                notificationSettings
              )
            }}
            save={_saveTransactionAlerts}
            onDelete={deleteEntry}
            error={error}
            editing={editing}
            setEditing={setEditing}
          />
        </Section>
      </>
    )
  )
}

const CryptoBalance = () => {
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(null)
  const { data, loading } = useQuery(GET_CRYPTO_BALANCE_ALERTS)

  const { config, cryptoCurrencies, notificationSettings } = !loading && data

  const [saveTransactionAlerts] = useMutation(SAVE_NOTIFICATION_SETTING, {
    refetchQueries: ['getCryptoBalanceAlerts'],
    onError: error => setError(error)
  })

  const [deleteOverride] = useMutation(DELETE_NOTIFICATION_SETTING, {
    refetchQueries: ['getCryptoBalanceAlerts'],
    onError: error => setError(error)
  })

  const _saveTransactionAlerts = obj =>
    saveTransactionAlerts({ variables: obj })

  const deleteEntry = (event, overrideId) =>
    deleteOverride({ variables: { event, overrideId } })

  return (
    !loading && (
      <Section title="Crypto balance alerts" error={error}>
        <CryptoBalanceAlerts
          fieldWidth={FIELDS_WIDTH}
          data={{
            config,
            notificationSettings: R.filter(it => R.isNil(it.overrideId))(
              notificationSettings
            )
          }}
          save={_saveTransactionAlerts}
          error={error}
          setError={setError}
          editing={editing}
          setEditing={setEditing}
        />
        <CryptoBalanceOverrides
          fieldWidth={FIELDS_WIDTH}
          data={{
            config,
            cryptoCurrencies,
            notificationSettings: R.filter(it => !R.isNil(it.overrideId))(
              notificationSettings
            )
          }}
          save={_saveTransactionAlerts}
          onDelete={deleteEntry}
          error={error}
          editing={editing}
          setEditing={setEditing}
        />
      </Section>
    )
  )
}

const Notifications = ({
  name: SCREEN_KEY,
  displaySetup = true,
  displayTransactionAlerts = true,
  displayFiatAlerts = true,
  displayCryptoAlerts = true,
  displayOverrides = true,
  displayTitle = true
}) => {
  const [error, setError] = useState(null)
  const [editingKey, setEditingKey] = useState(null)

  const { data, loading } = useQuery(GET_INFO)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: ['getData'],
    onCompleted: () => setEditingKey(null),
    onError: error => setError(error)
  })

  // const config = fromNamespace(SCREEN_KEY)(data?.config)
  const machines = data?.machines
  const cryptoCurrencies = data?.cryptoCurrencies

  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(data?.config)
  )

  const save = R.curry((section, rawConfig) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    setError(null)
    return saveConfig({ variables: { config } })
  })

  const setEditing = (key, state) => {
    if (!state) {
      setError(null)
    }
    setEditingKey(state ? key : null)
  }

  const isEditing = key => editingKey === key
  const isDisabled = key => editingKey && editingKey !== key

  const contextValue = {
    save,
    error,
    editingKey,
    data,
    loading,
    currency,
    isEditing,
    isDisabled,
    setEditing,
    machines,
    cryptoCurrencies
  }

  return (
    !loading && (
      <NotificationsCtx.Provider value={contextValue}>
        {/* {displayTitle && <TitleSection title="Notifications" />}
        <SetupAndTransactions
          displaySetup={displaySetup}
          displayTransactionAlerts={displayTransactionAlerts}
          section={section}
          error={error}
          editingKey={editingKey}
          wizard={wizard}
        />
        <FiatBalance
          displayFiatAlerts={displayFiatAlerts}
          displayOverrides={displayOverrides}
          error={error}
          section={section}
          data={data}
        />
        <CryptoBalance
          displayCryptoAlerts={displayCryptoAlerts}
          displayOverrides={displayOverrides}
          error={error}
          section={section}
        /> */}
      </NotificationsCtx.Provider>
    )
  )
}

export { Notifications, SetupAndTransactions, FiatBalance, CryptoBalance }
