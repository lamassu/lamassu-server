import React, { memo } from 'react'
import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  token: {
    code: 'token',
    display: 'API Token'
  }
}

const StrikeCard = memo(({ account, onEdit, ...props }) => {
  const getValue = getValueAux(account)

  const token = schema.token

  const tokenValue = getValue(token.code)

  const items = [
    {
      label: token.display,
      value: formatLong(tokenValue)
    }
  ]

  return (
    <Card
      account={account}
      title="Strike (Lightning Payments)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const StrikeForm = ({ account, ...props }) => {
  const getValue = getValueAux(account)

  const code = 'strike'
  const token = getValue(schema.token.code)

  const formik = {
    initialValues: {
      token: token
    },
    validationSchema: Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required('Required')
    })
  }

  const fields = [
    {
      name: schema.token.code,
      label: schema.token.display,
      type: 'text',
      component: SecretInputFormik
    }
  ]

  return (
    <>
      <EditService
        title="Strike"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { StrikeCard, StrikeForm }
