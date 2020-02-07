import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { Card, getValue as getValueAux } from './aux'
import EditService from './EditService'

const schema = {
  apiKey: {
    code: 'apiKey',
    display: 'API Key'
  },
  domain: {
    code: 'domain',
    display: 'Domain'
  },
  fromEmail: {
    code: 'fromEmail',
    display: 'From Email'
  },
  toEmail: {
    code: 'toEmail',
    display: 'To Email'
  }
}

const MailgunCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const fromEmail = schema.fromEmail
  const toEmail = schema.toEmail

  const fromEmailValue = getValue(fromEmail.code)
  const toEmailValue = getValue(toEmail.code)

  const items = [
    {
      label: fromEmail.display,
      value: fromEmailValue
    },
    {
      label: toEmail.display,
      value: toEmailValue
    }
  ]

  return (
    <Card
      account={account}
      title="Mailgun (Email)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getMailgunFormik = account => {
  const getValue = getValueAux(account)

  const apiKey = getValue(schema.apiKey.code)
  const domain = getValue(schema.domain.code)
  const fromEmail = getValue(schema.fromEmail.code)
  const toEmail = getValue(schema.toEmail.code)

  return {
    initialValues: {
      apiKey: apiKey,
      domain: domain,
      fromEmail: fromEmail,
      toEmail: toEmail
    },
    validationSchema: Yup.object().shape({
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      domain: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      fromEmail: Yup.string()
        .max(100, 'Too long')
        .email('Please input a valid email address')
        .required('Required'),
      toEmail: Yup.string()
        .max(100, 'Too long')
        .email('Please input a valid email address')
        .required('Required')
    })
  }
}

const getMailgunFields = () => [
  {
    name: schema.apiKey.code,
    label: schema.apiKey.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.domain.code,
    label: schema.domain.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.fromEmail.code,
    label: schema.fromEmail.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.toEmail.code,
    label: schema.toEmail.display,
    type: 'text',
    component: TextInputFormik
  }
]

const MailgunForm = ({ account, ...props }) => {
  const { code } = account

  const formik = getMailgunFormik(account)

  const fields = getMailgunFields()

  return (
    <>
      <EditService
        title="Mailgun"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { MailgunCard, MailgunForm, getMailgunFormik, getMailgunFields }
