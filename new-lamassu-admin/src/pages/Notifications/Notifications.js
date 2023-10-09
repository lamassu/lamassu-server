import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import TitleSection from 'src/components/layout/TitleSection'
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
import ThirdPartyProvider from './sections/ThirdPartyProvider'
import TransactionAlerts from './sections/TransactionAlerts'

const GET_INFO = gql`
  query getData {
    config
    accountsConfig {
      code
      display
      class
      cryptos
      deprecated
    }
    machines {
      name
      deviceId
      numberOfCassettes
      numberOfRecyclers
    }
    cryptoCurrencies {
      code
      display
    }
    accounts
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

const Notifications = ({
  name: SCREEN_KEY,
  displaySetup = true,
  displayTransactionAlerts = true,
  displayFiatAlerts = true,
  displayCryptoAlerts = true,
  displayOverrides = true,
  displayTitle = true,
  displayThirdPartyProvider = true,
  wizard = false
}) => {
  const [section, setSection] = useState(null)
  const [error, setError] = useState(null)
  const [editingKey, setEditingKey] = useState(null)
  const [smsSetupPopup, setSmsSetupPopup] = useState(false)
  const [emailSetupPopup, setEmailSetupPopup] = useState(false)

  const { data, loading } = useQuery(GET_INFO)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: ['getData'],
    onCompleted: () => setEditingKey(null),
    onError: error => setError(error)
  })

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => {
      setSmsSetupPopup(false)
      setEmailSetupPopup(false)
    },
    refetchQueries: ['getData'],
    onError: error => setError(error)
  })

  const config = fromNamespace(SCREEN_KEY)(data?.config)
  const machines = data?.machines
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies
  const twilioAvailable = R.has('twilio', data?.accounts || {})
  const mailgunAvailable = R.has('mailgun', data?.accounts || {})

  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(data?.config)
  )

  const save = R.curry((section, rawConfig) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    setSection(section)
    setError(null)
    return saveConfig({ variables: { config } })
  })

  const setEditing = (key, state) => {
    if (!state) {
      setError(null)
    }
    setEditingKey(state ? key : null)
  }

  const twilioSave = it => {
    setError(null)
    return saveAccount({
      variables: { accounts: { twilio: it } }
    }).then(() => R.compose(save(null), toNamespace('sms'))({ active: true }))
  }

  const mailgunSave = it => {
    setError(null)
    return saveAccount({
      variables: { accounts: { mailgun: it } }
    }).then(() => R.compose(save(null), toNamespace('email'))({ active: true }))
  }

  const isEditing = key => editingKey === key
  const isDisabled = key => editingKey && editingKey !== key

  const contextValue = {
    save,
    error,
    editingKey,
    data: config,
    currency,
    isEditing,
    isDisabled,
    setEditing,
    setSection,
    machines,
    accountsConfig,
    cryptoCurrencies,
    twilioAvailable,
    setSmsSetupPopup,
    mailgunAvailable,
    setEmailSetupPopup
  }

  return (
    !loading && (
      <>
        <NotificationsCtx.Provider value={contextValue}>
          {displayTitle && <TitleSection title="Notifications" />}
          {displayThirdPartyProvider && (
            <Section
              title="Third party providers"
              error={error && !section === 'thirdParty'}>
              <ThirdPartyProvider section="thirdParty" />
            </Section>
          )}
          {displaySetup && (
            <Section title="Setup" error={error && !section}>
              <Setup forceDisable={!!editingKey} wizard={wizard} />
            </Section>
          )}
          {displayTransactionAlerts && (
            <Section
              title="Transaction alerts"
              error={error && section === 'tx'}>
              <TransactionAlerts section="tx" fieldWidth={FIELDS_WIDTH} />
            </Section>
          )}
          {displayFiatAlerts && (
            <Section
              title="Fiat balance alerts"
              error={error && section === 'fiat'}>
              <FiatBalanceAlerts section="fiat" max={100} fieldWidth={50} />
              {displayOverrides && (
                <FiatBalanceOverrides
                  config={fromNamespace(namespaces.CASH_OUT)(data?.config)}
                  section="fiat"
                />
              )}
            </Section>
          )}
          {displayCryptoAlerts && (
            <Section
              title="Crypto balance alerts"
              error={error && section === 'crypto'}>
              <CryptoBalanceAlerts section="crypto" fieldWidth={FIELDS_WIDTH} />
              {displayOverrides && (
                <CryptoBalanceOverrides
                  section="crypto"
                  fieldWidth={FIELDS_WIDTH}
                />
              )}
            </Section>
          )}
        </NotificationsCtx.Provider>
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

export default Notifications
