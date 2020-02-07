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
  apiSecret: {
    code: 'apiSecret',
    display: 'API Secret'
  },
  endpoint: {
    code: 'endpoint',
    display: 'Endpoint'
  }
}

const InfuraCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const apiKey = schema.apiKey
  const apiSecret = schema.apiSecret

  const apiKeyValue = getValue(apiKey.code)
  const apiSecretValue = getValue(apiSecret.code)

  const items = [
    {
      label: apiKey.display,
      value: formatLong(apiKeyValue)
    },
    {
      label: apiSecret.display,
      value: formatLong(apiSecretValue)
    }
  ]

  return (
    <Card
      account={account}
      title="Infura (Wallet)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getInfuraFormik = account => {
  const getValue = getValueAux(account)

  const apiKey = getValue(schema.apiKey.code)
  const apiSecret = getValue(schema.apiSecret.code)
  const endpoint = getValue(schema.endpoint.code)

  return {
    initialValues: {
      apiKey: apiKey,
      apiSecret: apiSecret,
      endpoint: endpoint
    },
    validationSchema: Yup.object().shape({
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      apiSecret: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      endpoint: Yup.string()
        .max(100, 'Too long')
        .url('Please input a valid url')
        .required('Required')
    })
  }
}

const getInfuraFields = () => {
  return [
    {
      name: schema.apiKey.code,
      label: schema.apiKey.display,
      type: 'text',
      component: TextInputFormik
    },
    {
      name: schema.apiSecret.code,
      label: schema.apiSecret.display,
      type: 'text',
      component: SecretInputFormik
    },
    {
      name: schema.endpoint.code,
      label: schema.endpoint.display,
      type: 'text',
      component: TextInputFormik
    }
  ]
}

const InfuraForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getInfuraFormik(account)

  const fields = getInfuraFields()

  return (
    <>
      <EditService
        title="Infura"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { InfuraCard, InfuraForm, getInfuraFormik, getInfuraFields }
