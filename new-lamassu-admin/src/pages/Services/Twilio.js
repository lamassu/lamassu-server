import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux } from './aux'
import EditService from './EditService'

const schema = {
  accountSid: {
    code: 'accountSid',
    display: 'Account SID'
  },
  authToken: {
    code: 'authToken',
    display: 'Auth Token'
  },
  fromNumber: {
    code: 'fromNumber',
    display: 'From Number'
  },
  toNumber: {
    code: 'toNumber',
    display: 'To Number'
  }
}

const TwilioCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const fromNumber = schema.fromNumber
  const toNumber = schema.toNumber

  const fromNumberValue = getValue(fromNumber.code)
  const toNumberValue = getValue(toNumber.code)

  const items = [
    {
      label: fromNumber.display,
      value: fromNumberValue
    },
    {
      label: toNumber.display,
      value: toNumberValue
    }
  ]

  return (
    <Card
      account={account}
      title="Twilio (SMS)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getTwilioFormik = account => {
  const getValue = getValueAux(account)

  const accountSid = getValue(schema.accountSid.code)
  const authToken = getValue(schema.authToken.code)
  const fromNumber = getValue(schema.fromNumber.code)
  const toNumber = getValue(schema.toNumber.code)

  return {
    initialValues: {
      accountSid: accountSid,
      authToken: authToken,
      fromNumber: fromNumber,
      toNumber: toNumber
    },
    validationSchema: Yup.object().shape({
      accountSid: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      authToken: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      fromNumber: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      toNumber: Yup.string()
        .max(100, 'Too long')
        .required('Required')
    })
  }
}

const getTwilioFields = () => [
  {
    name: schema.accountSid.code,
    label: schema.accountSid.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.authToken.code,
    label: schema.authToken.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.fromNumber.code,
    label: schema.fromNumber.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.toNumber.code,
    label: schema.toNumber.display,
    type: 'text',
    component: TextInputFormik
  }
]

const TwilioForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getTwilioFormik(account)

  const fields = getTwilioFields()

  return (
    <>
      <EditService
        title="Twilio"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { TwilioCard, TwilioForm, getTwilioFormik, getTwilioFields }
