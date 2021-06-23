import { useMutation, useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import {
  defaultSchema,
  getOverridesSchema,
  defaults,
  overridesDefaults,
  getDefaultSettings,
  getOverrides
} from './helper'

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    config
  }
`

const AdvancedTriggersSettings = memo(() => {
  const SCREEN_KEY = namespaces.TRIGGERS
  const [error, setError] = useState(null)
  const [isEditingDefault, setEditingDefault] = useState(false)
  const [isEditingOverrides, setEditingOverrides] = useState(false)

  const { data } = useQuery(GET_INFO)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const saveDefaults = it => {
    const newConfig = toNamespace(SCREEN_KEY)(it.triggersConfig[0])
    setError(null)
    return saveConfig({
      variables: { config: newConfig }
    })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    setError(null)
    return saveConfig({ variables: { config } })
  }

  const requirementsData =
    data?.config && fromNamespace(SCREEN_KEY)(data?.config)
  const requirementsDefaults =
    requirementsData && !R.isEmpty(requirementsData)
      ? requirementsData
      : defaults
  const requirementsOverrides = requirementsData?.overrides ?? []

  const onEditingDefault = (it, editing) => setEditingDefault(editing)
  const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

  return (
    <>
      <Section>
        <EditableTable
          title="Default requirement settings"
          error={error?.message}
          titleLg
          name="triggersConfig"
          enableEdit
          initialValues={requirementsDefaults}
          save={saveDefaults}
          validationSchema={defaultSchema}
          data={R.of(requirementsDefaults)}
          elements={getDefaultSettings()}
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
          initialValues={overridesDefaults}
          save={saveOverrides}
          validationSchema={getOverridesSchema(requirementsOverrides)}
          data={requirementsOverrides}
          elements={getOverrides()}
          setEditing={onEditingOverrides}
          forceDisable={isEditingDefault}
        />
      </Section>
    </>
  )
})

export default AdvancedTriggersSettings
