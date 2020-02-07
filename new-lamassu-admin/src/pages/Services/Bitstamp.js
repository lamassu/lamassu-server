import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  clientId: {
    code: 'clientId',
    display: 'Client ID'
  },
  key: {
    code: 'key',
    display: 'API Key'
  },
  secret: {
    code: 'secret',
    display: 'API Secret'
  }
}

const BitstampCard = memo(({ account, onEdit, ...props }) => {
  const findValue = getValueAux(account)

  const clientId = schema.clientId
  const key = schema.key

  const clientIdValue = findValue(clientId.code)
  const keyValue = findValue(key.code)

  const items = [
    {
      label: clientId.display,
      value: formatLong(clientIdValue)
    },
    {
      label: key.display,
      value: formatLong(keyValue)
    }
  ]

  return (
    <Card
      account={account}
      title="Bitstamp (Exchange)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getBitstampFormik = account => {
  const getValue = getValueAux(account)

  const clientId = getValue(schema.clientId.code)
  const key = getValue(schema.key.code)
  const secret = getValue(schema.secret.code)

  return {
    initialValues: {
      clientId: clientId,
      key: key,
      secret: secret
    },
    validationSchema: Yup.object().shape({
      clientId: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      key: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      secret: Yup.string()
        .max(100, 'Too long')
        .required('Required')
    })
  }
}

const getBitstampFields = () => [
  {
    name: schema.clientId.code,
    label: schema.clientId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.key.code,
    label: schema.key.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.secret.code,
    label: schema.secret.display,
    type: 'text',
    component: SecretInputFormik
  }
]

const BitstampForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getBitstampFormik(account)

  const fields = getBitstampFields()

  return (
    <>
      <EditService
        title="Bitstamp"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { BitstampForm, BitstampCard, getBitstampFormik, getBitstampFields }
