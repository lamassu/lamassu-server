import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  token: {
    code: 'token',
    display: 'API Token'
  },
  confidenceFactor: {
    code: 'confidenceFactor',
    display: 'Confidence Factor'
  }
}

const BlockcypherCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const token = schema.token
  const confidenceFactor = schema.confidenceFactor

  const tokenValue = getValue(token.code)
  const confidenceFactorValue = getValue(confidenceFactor.code)

  const items = [
    {
      label: token.display,
      value: formatLong(tokenValue)
    },
    {
      label: confidenceFactor.display,
      value: confidenceFactorValue
    }
  ]

  return (
    <Card
      account={account}
      title="Blockcypher (Payments)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getBlockcypherFormik = account => {
  const getValue = getValueAux(account)

  const token = getValue(schema.token.code)
  const confidenceFactor = getValue(schema.confidenceFactor.code)

  return {
    initialValues: {
      token: token,
      confidenceFactor: confidenceFactor
    },
    validationSchema: Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      confidenceFactor: Yup.number()
        .integer('Please input a positive integer')
        .positive('Please input a positive integer')
        .required('Required')
    })
  }
}

const getBlockcypherFields = () => [
  {
    name: schema.token.code,
    label: schema.token.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.confidenceFactor.code,
    label: schema.confidenceFactor.display,
    type: 'text',
    component: TextInputFormik
  }
]

const BlockcypherForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getBlockcypherFormik(account)

  const fields = getBlockcypherFields()

  return (
    <>
      <EditService
        title="Blockcypher"
        code={code}
        formik={formik}
        fields={fields}
        {...props}
      />
    </>
  )
}

export {
  BlockcypherForm,
  BlockcypherCard,
  getBlockcypherFormik,
  getBlockcypherFields
}
