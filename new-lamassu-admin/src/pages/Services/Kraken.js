import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  apiKey: {
    code: 'apiKey',
    display: 'API Key'
  },
  privateKey: {
    code: 'privateKey',
    display: 'Private Key'
  }
}

const KrakenCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const apiKey = schema.apiKey
  const privateKey = schema.privateKey

  const apiKeyValue = getValue(apiKey.code)
  const privateKeyValue = getValue(privateKey.code)

  const items = [
    apiKey && {
      label: apiKey.display,
      value: formatLong(apiKeyValue)
    },
    privateKey && {
      label: privateKey.display,
      value: formatLong(privateKeyValue)
    }
  ]

  return (
    <Card
      account={account}
      title="Kraken (Exchange)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getKrakenFormik = account => {
  const getValue = getValueAux(account)

  const apiKey = getValue(schema.apiKey.code)
  const privateKey = getValue(schema.privateKey.code)

  return {
    initialValues: {
      apiKey: apiKey,
      privateKey: privateKey
    },
    validationSchema: Yup.object().shape({
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      privateKey: Yup.string()
        .max(100, 'Too long')
        .required('Required')
    })
  }
}

const getKrakenFields = () => [
  {
    name: schema.apiKey.code,
    label: schema.apiKey.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.privateKey.code,
    label: schema.privateKey.display,
    type: 'text',
    component: SecretInputFormik
  }
]

const KrakenForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getKrakenFormik(account)

  const fields = getKrakenFields()

  return (
    <>
      <EditService
        title="Kraken"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { KrakenCard, KrakenForm, getKrakenFormik, getKrakenFields }
