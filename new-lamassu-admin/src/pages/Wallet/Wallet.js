import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Prompt from 'src/components/Prompt'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace, toNamespace } from 'src/utils/config'

import Wizard from './Wizard'
import { WalletSchema, getElements } from './helper'

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject, $accounts: JSONObject) {
    saveConfig(config: $config)
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
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const Wallet = ({ name: SCREEN_KEY }) => {
  const [isUnsaved, setIsUnsaved] = useState(false)
  const [wizard, setWizard] = useState(false)
  const [error, setError] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    onError: () => setError(true),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    setError(false)
    return saveConfig({ variables: { config, accounts } })
  }

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const accounts = data?.accounts ?? []

  const onToggle = id => {
    const namespaced = fromNamespace(id)(config)
    if (!WalletSchema.isValidSync(namespaced)) return setWizard(id)
    save(toNamespace(id, { active: !namespaced?.active }))
  }

  return (
    <>
      <Prompt when={isUnsaved} />
      <TitleSection title="Wallet Settings" error={error} />
      <EditableTable
        name="test"
        namespaces={R.map(R.path(['code']))(cryptoCurrencies)}
        data={config}
        stripeWhen={it => !WalletSchema.isValidSync(it)}
        enableEdit
        setEditing={setIsUnsaved}
        setAdding={setIsUnsaved}
        editWidth={134}
        enableToggle
        toggleWidth={109}
        onToggle={onToggle}
        save={save}
        validationSchema={WalletSchema}
        disableRowEdit={R.compose(R.not, R.path(['active']))}
        elements={getElements(cryptoCurrencies, accountsConfig)}
      />
      {wizard && (
        <Wizard
          coin={R.find(R.propEq('code', wizard))(cryptoCurrencies)}
          onClose={() => setWizard(false)}
          save={save}
          error={error}
          cryptoCurrencies={cryptoCurrencies}
          userAccounts={data?.config?.accounts}
          accounts={accounts}
          accountsConfig={accountsConfig}
        />
      )}
    </>
  )
}

export default Wallet
