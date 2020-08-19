import { useQuery, useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import { fromNamespace, toNamespace } from 'src/utils/config'

import {
  mainFields,
  overrides,
  LocaleSchema,
  OverridesSchema,
  localeDefaults,
  overridesDefaults
} from './helper'

const GET_DATA = gql`
  query getData {
    config
    currencies {
      code
      display
    }
    countries {
      code
      display
    }
    cryptoCurrencies {
      code
      display
    }
    languages {
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

const Locales = ({ name: SCREEN_KEY }) => {
  const { data } = useQuery(GET_DATA)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)

  const locale = config && !R.isEmpty(config) ? config : localeDefaults
  const localeOverrides = locale.overrides ?? []

  const save = it => {
    const config = toNamespace(SCREEN_KEY)(it.locale[0])
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  return (
    <>
      <TitleSection title="Locales" />
      <Section>
        <EditableTable
          title="Default settings"
          titleLg
          name="locale"
          enableEdit
          initialValues={locale}
          save={save}
          validationSchema={LocaleSchema}
          data={R.of(locale)}
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
          data={localeOverrides}
          elements={overrides(data, localeOverrides)}
        />
      </Section>
    </>
  )
}

export default Locales
