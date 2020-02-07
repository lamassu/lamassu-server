import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  userId: {
    code: 'userId',
    display: 'User ID'
  },
  walletId: {
    code: 'walletId',
    display: 'Wallet ID'
  },
  clientKey: {
    code: 'clientKey',
    display: 'Client Key'
  },
  clientSecret: {
    code: 'clientSecret',
    display: 'Client Secret'
  }
}

const ItbitCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const userId = schema.userId
  const walletId = schema.walletId

  const userIdValue = getValue(userId.code)
  const walletIdValue = getValue(walletId.code)

  const items = [
    {
      label: userId.display,
      value: formatLong(userIdValue)
    },
    {
      label: walletId.display,
      value: formatLong(walletIdValue)
    }
  ]

  return (
    <Card account={account} title="itBit ()" items={items} onEdit={onEdit} />
  )
})

const getItbitFormik = account => {
  const getValue = getValueAux(account)

  const userId = getValue(schema.userId.code)
  const walletId = getValue(schema.walletId.code)
  const clientKey = getValue(schema.clientKey.code)
  const clientSecret = getValue(schema.clientSecret.code)

  return {
    initialValues: {
      userId: userId,
      walletId: walletId,
      clientKey: clientKey,
      clientSecret: clientSecret
    },
    validationSchema: Yup.object().shape({
      userId: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      walletId: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      clientKey: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      clientSecret: Yup.string()
        .max(100, 'Too long')
        .required('Required')
    })
  }
}

const getItbitFields = () => [
  {
    name: schema.userId.code,
    label: schema.userId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.walletId.code,
    label: schema.walletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.clientKey.code,
    label: schema.clientKey.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.clientSecret.code,
    label: schema.clientSecret.display,
    type: 'text',
    component: SecretInputFormik
  }
]

const ItbitForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getItbitFormik(account)

  const fields = getItbitFields()

  return (
    <>
      <EditService
        title="itBit"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { ItbitCard, ItbitForm, getItbitFormik, getItbitFields }
