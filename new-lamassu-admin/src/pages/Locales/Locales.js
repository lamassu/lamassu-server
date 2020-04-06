import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import { fromServer, toServer } from 'src/utils/config'

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

  const config = data?.config && fromServer(SCREEN_KEY)(data.config)

  const locale = config && !R.isEmpty(config) ? config : localeDefaults

  const save = it => {
    const config = toServer(SCREEN_KEY)(it.locale[0])
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = it => {
    const config = toServer(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  return (
    <>
      <TitleSection title="Locales" />
      <Section title="Default settings">
        <EditableTable
          name="locale"
          enableEdit
          initialValues={locale}
          save={save}
          validationSchema={LocaleSchema}
          data={R.of(locale)}
          elements={mainFields(data)}
        />
      </Section>
      <Section title="Overrides">
        <EditableTable
          name="overrides"
          enableDelete
          enableEdit
          enableCreate
          initialValues={overridesDefaults}
          save={saveOverrides}
          validationSchema={OverridesSchema}
          data={locale.overrides ?? []}
          elements={overrides(data)}
        />
      </Section>
    </>
  )
}

export default Locales
