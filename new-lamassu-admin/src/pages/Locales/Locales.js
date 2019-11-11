import React, { memo, useState } from 'react'
import * as Yup from 'yup'
import useAxios from '@use-hooks/axios'

import Title from '../../components/Title'
import Subtitle from '../../components/Subtitle'
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

const Locales = memo(() => {
  const [locale, setLocale] = useState(initialValues)
  const [data, setData] = useState(null)

  useAxios({
    url: 'http://localhost:8070/api/config',
    method: 'GET',
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setLocale(res.data.state)
        setData(res.data.data)
      }
    }
  })

  const { reFetch } = useAxios({
    url: 'http://localhost:8070/api/config',
    method: 'POST',
    options: {
      data: locale
    }
  })

  const save = (it) => {
    setLocale(it)
    reFetch()
  }

  return (
    <>
      <Title>Locales</Title>
      <Subtitle>Default settings</Subtitle>
      <MainForm validationSchema={LocaleSchema} value={locale} save={save} auxData={data} />
      <Subtitle extraMarginTop>Overrides</Subtitle>
    </>
  )
})

export default Locales
