import { useQuery, useMutation } from '@apollo/react-hooks'
import { utils as coinUtils } from '@lamassu/coins'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import {
  AdvancedWalletSchema,
  getAdvancedWalletElements,
  getAdvancedWalletElementsOverrides,
  OverridesDefaults,
  OverridesSchema
} from './helper'

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`
const GET_INFO = gql`
  query getData {
    config
    cryptoCurrencies {
      code
      display
    }
  }
`

const AdvancedWallet = () => {
  const ADVANCED = namespaces.ADVANCED
  const CRYPTOCURRENCY_KEY = 'cryptoCurrency'
  const SCREEN_KEY = namespaces.WALLETS
  const { data } = useQuery(GET_INFO)

  const [isEditingDefault, setEditingDefault] = useState(false)
  const [isEditingOverrides, setEditingOverrides] = useState(false)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const save = rawConfig => {
    const config = toNamespace(SCREEN_KEY)(
      toNamespace(ADVANCED)(rawConfig.wallets[0])
    )
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = rawConfig => {
    const config = toNamespace(SCREEN_KEY)(toNamespace(ADVANCED)(rawConfig))
    return saveConfig({ variables: { config } })
  }

  const onEditingDefault = (it, editing) => setEditingDefault(editing)
  const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  const AdvancedWalletSettings = fromNamespace(ADVANCED)(
    fromNamespace(SCREEN_KEY)(data?.config)
  )

  const AdvancedWalletSettingsOverrides = AdvancedWalletSettings.overrides ?? []

  const overriddenCryptos = R.map(R.prop(CRYPTOCURRENCY_KEY))(
    AdvancedWalletSettingsOverrides
  )
  const suggestionFilter = R.filter(
    it => !R.contains(it.code, overriddenCryptos)
  )
  const coinSuggestions = suggestionFilter(cryptoCurrencies)

  const findSuggestion = it => {
    const coin = R.compose(R.find(R.propEq('code', it?.cryptoCurrency)))(
      cryptoCurrencies
    )
    return coin ? [coin] : []
  }

  return (
    <>
      <Section>
        <EditableTable
          name="wallets"
          data={R.of(AdvancedWalletSettings)}
          error={error?.message}
          enableEdit
          editWidth={174}
          save={save}
          stripeWhen={it => !AdvancedWalletSchema.isValidSync(it)}
          inialValues={R.of(AdvancedWalletSettings)}
          validationSchema={AdvancedWalletSchema}
          elements={getAdvancedWalletElements(
            coinUtils,
            AdvancedWalletSettings
          )}
          setEditing={onEditingDefault}
          forceDisable={isEditingOverrides}
        />
      </Section>
      <Section>
        <EditableTable
          error={error?.message}
          title="Overrides"
          titleLg
          name="overrides"
          enableDelete
          enableEdit
          enableCreate
          inialValues={OverridesDefaults}
          save={saveOverrides}
          validationSchema={OverridesSchema}
          data={AdvancedWalletSettingsOverrides ?? []}
          elements={getAdvancedWalletElementsOverrides(
            coinSuggestions,
            findSuggestion,
            coinUtils
          )}
          disableAdd={!coinSuggestions?.length}
          setEditing={onEditingOverrides}
          forceDisable={isEditingDefault}
        />
      </Section>
    </>
  )
}

export default AdvancedWallet
