import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace, toNamespace } from 'src/utils/config'

import {
  mainFields,
  overrides,
  schema,
  OverridesSchema,
  defaults,
  overridesDefaults
} from './helper'

const GET_DATA = gql`
  query getData {
    config
    cryptoCurrencies {
      code
      display
    }
    machines {
      name
      deviceId
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const Commissions = ({ name: SCREEN_KEY }) => {
  const { data } = useQuery(GET_DATA)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)

  const commission = config && !R.isEmpty(config) ? config : defaults

  const save = it => {
    const config = toNamespace(SCREEN_KEY)(it.commissions[0])
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  return (
    <>
      <TitleSection title="Commissions" />
      <Section>
        <EditableTable
          title="Default setup"
          rowSize="lg"
          titleLg
          name="commissions"
          enableEdit
          initialValues={commission}
          save={save}
          validationSchema={schema}
          data={R.of(commission)}
          elements={mainFields(data)}
        />
      </Section>
      <Section>
        <EditableTable
          title="Overrides"
          titleLg
          name="overrides"
          enableDelete
          enableEdit
          enableCreate
          initialValues={overridesDefaults}
          save={saveOverrides}
          validationSchema={OverridesSchema}
          data={commission.overrides ?? []}
          elements={overrides(data)}
        />
      </Section>
    </>
  )
}

export default Commissions
