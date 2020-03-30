import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import React, { memo } from 'react'
import * as Yup from 'yup'

import Subtitle from 'src/components/Subtitle'
import Title from 'src/components/Title'

import MainForm from './MainForm'

const LocaleSchema = Yup.object().shape({
  country: Yup.object().required('Required'),
  fiatCurrency: Yup.object().required('Required'),
  languages: Yup.array().required('Required'),
  cryptoCurrencies: Yup.array().required('Required')
})

const initialValues = {
  country: null,
  fiatCurrency: null,
  languages: [],
  cryptoCurrencies: [],
  showRates: false
}

const GET_AUX_DATA = gql`
  {
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
  }
`

const GET_CONFIG = gql`
  {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const Locales = memo(() => {
  const { data } = useQuery(GET_AUX_DATA)

  const [saveConfig] = useMutation(SAVE_CONFIG)
  const { data: configResponse } = useQuery(GET_CONFIG)

  const locale = configResponse?.config ?? initialValues

  const save = it => saveConfig({ variables: { config: it } })

  return (
    <>
      <Title>Locales</Title>
      <Subtitle>Default settings</Subtitle>
      <MainForm
        validationSchema={LocaleSchema}
        value={locale}
        save={save}
        auxData={data}
      />
      <Subtitle extraMarginTop>Overrides</Subtitle>
    </>
  )
})

export default Locales
