import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { utils as coinUtils } from 'lamassu-coins'
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
  const ADVANCED = 'advanced'
  const CRYPTOCURRENCY_KEY = 'cryptoCurrency'
  const SCREEN_KEY = namespaces.WALLETS
  const { data } = useQuery(GET_INFO)

  const [isEditingDefault, setEditingDefault] = useState(false)
  const [isEditingOverrides, setEditingOverrides] = useState(false)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const mapConfigKeys = R.curry((fn, obj) =>
    R.zipObj(R.map(fn, R.keys(obj)), R.values(obj))
  )

  const save = rawConfig => {
    const config = toNamespace(SCREEN_KEY)(
      mapConfigKeys(it => `${ADVANCED}_` + it, rawConfig.wallets[0])
    )

    return saveConfig({ variables: { config } })
  }

  const saveOverrides = rawConfig => {
    const config = toNamespace(SCREEN_KEY)(
      mapConfigKeys(it => `${ADVANCED}_` + it, rawConfig)
    )
    return saveConfig({ variables: { config } })
  }

  const onEditingDefault = (it, editing) => setEditingDefault(editing)
  const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  const AdvancedWalletSettings = mapConfigKeys(
    it => R.tail(R.split('_', it)),
    R.pickBy(
      (val, key) => R.head(R.split('_', key)) === ADVANCED,
      data?.config && fromNamespace(SCREEN_KEY)(data.config)
    )
  )

  const AdvancedWalletSettingsOverrides = AdvancedWalletSettings.overrides ?? []

  const overridenCryptos = R.map(R.prop(CRYPTOCURRENCY_KEY))(
    AdvancedWalletSettingsOverrides
  )
  const suggestionFilter = R.filter(
    it => !R.contains(it.code, overridenCryptos)
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
