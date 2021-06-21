import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { AdvancedWalletSchema, getAdvancedWalletElements } from './helper'

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
    cryptoCurrencies {
      code
      display
    }
  }
`

const AdvancedWallet = () => {
  const SCREEN_KEY = namespaces.WALLETS
  const { data } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  return (
    <>
      <EditableTable
        name="advancedWallet"
        namespaces={R.map(R.path(['code']))(cryptoCurrencies)}
        data={config}
        error={error?.message}
        enableEdit
        editWidth={174}
        save={save}
        validationSchema={AdvancedWalletSchema}
        elements={getAdvancedWalletElements(cryptoCurrencies)}
      />
    </>
  )
}

export default AdvancedWallet
