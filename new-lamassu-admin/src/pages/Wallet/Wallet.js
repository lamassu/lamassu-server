import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import TitleSection from 'src/components/layout/TitleSection'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schemas from 'src/pages/Services/schemas'
import { fromNamespace, toNamespace } from 'src/utils/config'

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

const Wallet = ({ name: SCREEN_KEY }) => {
  const [editingSchema, setEditingSchema] = useState(null)
  const [onChangeFunction, setOnChangeFunction] = useState(null)
  const [wizard, setWizard] = useState(false)
  const { data } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData']
  })

  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const accountsConfig = data?.accountsConfig
  const cryptoCurrencies = data?.cryptoCurrencies ?? []
  const accounts = data?.accounts ?? []

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
      <TitleSection title="Wallet Settings" />
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
  )
}

export default Wallet
