import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { HelpTooltip } from 'src/components/Tooltip'
import { SupportLinkButton } from 'src/components/buttons'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import TitleSection from 'src/components/layout/TitleSection'
import { P } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import _schemas from 'src/pages/Services/schemas'
import { ReactComponent as ReverseSettingsIcon } from 'src/styling/icons/circle buttons/settings/white.svg'
import { ReactComponent as SettingsIcon } from 'src/styling/icons/circle buttons/settings/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'

import AdvancedWallet from './AdvancedWallet'
import Wizard from './Wizard'
import { WalletSchema, getElements } from './helper'

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject, $accounts: JSONObject) {
    saveConfig(config: $config)
    saveAccounts(accounts: $accounts)
  }
`

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const GET_INFO = gql`
  query getData {
    config
    accounts
    accountsConfig {
      code
      display
      class
      cryptos
      deprecated
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const GET_MARKETS = gql`
  query getMarkets {
    getMarkets
  }
`

const LOCALE = 'locale'

const Wallet = ({ name: SCREEN_KEY }) => {
  const [editingSchema, setEditingSchema] = useState(null)
  const [onChangeFunction, setOnChangeFunction] = useState(null)
  const [wizard, setWizard] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData']
  })

  const { data: marketsData } = useQuery(GET_MARKETS)

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const fiatCurrency =
    data?.config && fromNamespace(LOCALE)(data.config).fiatCurrency

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const accounts = data?.accounts ?? []

  const markets = marketsData?.getMarkets

  const schemas = _schemas(markets)

  const onChange = (previous, current, setValue) => {
    if (!current) return setValue(current)

    if (!accounts[current] && schemas[current]) {
      setEditingSchema(schemas[current])
      setOnChangeFunction(() => () => setValue(current))
      return
    }

    setValue(current)
  }

  const shouldOverrideEdit = it => {
    const namespaced = fromNamespace(it)(config)
    return !WalletSchema.isValidSync(namespaced)
  }

  const wizardSave = it =>
    saveAccount({
      variables: { accounts: { [editingSchema.code]: it } }
    }).then(it => {
      onChangeFunction()
      setOnChangeFunction(null)
      return it
    })

  return (
    <>
      <TitleSection
        title="Wallet settings"
        buttons={[
          {
            text: 'Advanced settings',
            icon: SettingsIcon,
            inverseIcon: ReverseSettingsIcon,
            toggle: setAdvancedSettings
          }
        ]}
        appendix={
          <HelpTooltip width={340}>
            <P>
              For details on configuring wallets, please read the relevant
              knowledgebase article:
            </P>
            <SupportLinkButton
              link="https://support.lamassu.is/hc/en-us/articles/360000725832-Wallets-Exchange-Linkage-and-Volatility"
              label="Wallets, Exchange Linkage, and Volatility"
              bottomSpace="1"
            />
          </HelpTooltip>
        }
      />
      {!advancedSettings && (
        <>
          <EditableTable
            name="test"
            namespaces={R.map(R.path(['code']))(cryptoCurrencies)}
            data={config}
            error={error?.message}
            stripeWhen={it => !WalletSchema.isValidSync(it)}
            enableEdit
            shouldOverrideEdit={shouldOverrideEdit}
            editOverride={setWizard}
            editWidth={174}
            save={save}
            validationSchema={WalletSchema}
            elements={getElements(cryptoCurrencies, accountsConfig, onChange)}
          />
          {wizard && (
            <Wizard
              coin={R.find(R.propEq('code', wizard))(cryptoCurrencies)}
              onClose={() => setWizard(false)}
              save={save}
              error={error?.message}
              cryptoCurrencies={cryptoCurrencies}
              fiatCurrency={fiatCurrency}
              userAccounts={data?.config?.accounts}
              accounts={accounts}
              accountsConfig={accountsConfig}
            />
          )}
          {editingSchema && (
            <Modal
              title={`Edit ${editingSchema.name}`}
              width={478}
              handleClose={() => setEditingSchema(null)}
              open={true}>
              <FormRenderer
                save={wizardSave}
                elements={editingSchema.elements}
                validationSchema={editingSchema.validationSchema}
                value={accounts[editingSchema.code]}
              />
            </Modal>
          )}
        </>
      )}
      {advancedSettings && <AdvancedWallet></AdvancedWallet>}
    </>
  )
}

export default Wallet
