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

const SAVE_TRIGGERS_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveTriggersConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    triggersConfig
  }
`

const GET_CUSTOM_REQUESTS = gql`
  query customInfoRequests {
    customInfoRequests {
      id
      customRequest
      enabled
    }
  }
`

const AdvancedTriggersSettings = memo(() => {
  const SCREEN_KEY = namespaces.TRIGGERS_CONFIG
  const [error, setError] = useState(null)
  const [isEditingDefault, setEditingDefault] = useState(false)
  const [isEditingOverrides, setEditingOverrides] = useState(false)

  const { data, loading: configLoading } = useQuery(GET_INFO)
  const { data: customInfoReqData, loading: customInfoLoading } = useQuery(
    GET_CUSTOM_REQUESTS
  )

  const customInfoRequests =
    R.path(['customInfoRequests'])(customInfoReqData) ?? []
  const enabledCustomInfoRequests = R.filter(R.propEq('enabled', true))(
    customInfoRequests
  )

  const loading = configLoading || customInfoLoading

  const [saveTriggersConfig] = useMutation(SAVE_TRIGGERS_CONFIG, {
    refetchQueries: () => ['getData'],
    onError: error => setError(error)
  })

  const saveDefaults = it => {
    const newConfig = toNamespace(SCREEN_KEY)(it.triggersConfig[0])
    setError(null)
    return saveTriggersConfig({
      variables: { config: newConfig }
    })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    setError(null)
    return saveTriggersConfig({ variables: { config } })
  }

  const requirementsData =
    data?.triggersConfig && fromNamespace(SCREEN_KEY)(data?.triggersConfig)

  const requirementsDefaults =
    requirementsData && !R.isEmpty(requirementsData)
      ? requirementsData
      : defaults
  const requirementsOverrides = requirementsData?.overrides ?? []

  const onEditingDefault = (it, editing) => setEditingDefault(editing)
  const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

  return (
    !loading && (
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
            validationSchema={getOverridesSchema(
              requirementsOverrides,
              enabledCustomInfoRequests
            )}
            data={requirementsOverrides}
            elements={getOverrides(enabledCustomInfoRequests)}
            setEditing={onEditingOverrides}
            forceDisable={isEditingDefault}
          />
        </Section>
      </>
    )
  )
})

export default AdvancedTriggersSettings
