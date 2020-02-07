import React, { memo } from 'react'
import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'
import SecretInputFormik from 'src/components/inputs/formik/SecretInput'

import { Card, getValue as getValueAux, formatLong } from './aux'
import EditService from './EditService'

const schema = {
  token: {
    code: 'token',
    display: 'API Token'
  },
  btcWalletId: {
    code: 'BTCWalletId',
    display: 'BTC Wallet ID'
  },
  btcWalletPassphrase: {
    code: 'BTCWalletPassphrase',
    display: 'BTC Wallet Passphrase'
  },
  ltcWalletId: {
    code: 'LTCWalletId',
    display: 'LTC Wallet ID'
  },
  ltcWalletPassphrase: {
    code: 'LTCWalletPassphrase',
    display: 'LTC Wallet Passphrase'
  },
  zecWalletId: {
    code: 'ZECWalletId',
    display: 'ZEC Wallet ID'
  },
  zecWalletPassphrase: {
    code: 'ZECWalletPassphrase',
    display: 'ZEC Wallet Passphrase'
  },
  bchWalletId: {
    code: 'BCHWalletId',
    display: 'BCH Wallet ID'
  },
  bchWalletPassphrase: {
    code: 'BCHWalletPassphrase',
    display: 'BCH Wallet Passphrase'
  },
  dashWalletId: {
    code: 'DASHWalletId',
    display: 'DASH Wallet ID'
  },
  dashWalletPassphrase: {
    code: 'DASHWalletPassphrase',
    display: 'DASH Wallet Passphrase'
  },
  environment: {
    code: 'environment',
    display: 'Environment'
  }
}

const BitgoCard = memo(({ account, onEdit, ...props }) => {
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
      title="BitGo (Wallet)"
      items={items}
      onEdit={onEdit}
    />
  )
})

const getBitgoFormik = account => {
  const getValue = getValueAux(account)

  const token = getValue(schema.token.code)
  const btcWalletId = getValue(schema.btcWalletId.code)
  const btcWalletPassphrase = getValue(schema.btcWalletPassphrase.code)
  const ltcWalletId = getValue(schema.ltcWalletId.code)
  const ltcWalletPassphrase = getValue(schema.ltcWalletPassphrase.code)
  const zecWalletId = getValue(schema.zecWalletId.code)
  const zecWalletPassphrase = getValue(schema.zecWalletPassphrase.code)
  const bchWalletId = getValue(schema.bchWalletId.code)
  const bchWalletPassphrase = getValue(schema.bchWalletPassphrase.code)
  const dashWalletId = getValue(schema.dashWalletId.code)
  const dashWalletPassphrase = getValue(schema.dashWalletPassphrase.code)
  const environment = getValue(schema.environment.code)

  return {
    initialValues: {
      token: token,
      BTCWalletId: btcWalletId,
      BTCWalletPassphrase: btcWalletPassphrase,
      LTCWalletId: ltcWalletId,
      LTCWalletPassphrase: ltcWalletPassphrase,
      ZECWalletId: zecWalletId,
      ZECWalletPassphrase: zecWalletPassphrase,
      BCHWalletId: bchWalletId,
      BCHWalletPassphrase: bchWalletPassphrase,
      DASHWalletId: dashWalletId,
      DASHWalletPassphrase: dashWalletPassphrase,
      environment: environment
    },
    validationSchema: Yup.object().shape({
      token: Yup.string()
        .max(100, 'Too long')
        .required('Required'),
      btcWalletId: Yup.string().max(100, 'Too long'),
      btcWalletPassphrase: Yup.string().max(100, 'Too long'),
      ltcWalletId: Yup.string().max(100, 'Too long'),
      ltcWalletPassphrase: Yup.string().max(100, 'Too long'),
      zecWalletId: Yup.string().max(100, 'Too long'),
      zecWalletPassphrase: Yup.string().max(100, 'Too long'),
      bchWalletId: Yup.string().max(100, 'Too long'),
      bchWalletPassphrase: Yup.string().max(100, 'Too long'),
      dashWalletId: Yup.string().max(100, 'Too long'),
      dashWalletPassphrase: Yup.string().max(100, 'Too long'),
      environment: Yup.string()
        .matches(/(prod|test)/)
        .required('Required')
    }),
    validate: values => {
      const errors = {}

      if (values.btcWalletId && !values.btcWalletPassphrase) {
        errors.btcWalletPassphrase = 'Required'
      }

      if (values.ltcWalletId && !values.ltcWalletPassphrase) {
        errors.ltcWalletPassphrase = 'Required'
      }

      if (values.zecWalletId && !values.zecWalletPassphrase) {
        errors.zecWalletPassphrase = 'Required'
      }

      if (values.bchWalletId && !values.bchWalletPassphrase) {
        errors.bchWalletPassphrase = 'Required'
      }

      if (values.dashWalletId && !values.dashWalletPassphrase) {
        errors.dashWalletPassphrase = 'Required'
      }

      return errors
    }
  }
}

const getBitgoFields = () => [
  {
    name: schema.token.code,
    label: schema.token.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.btcWalletId.code,
    label: schema.btcWalletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.btcWalletPassphrase.code,
    label: schema.btcWalletPassphrase.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.ltcWalletId.code,
    label: schema.ltcWalletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.ltcWalletPassphrase.code,
    label: schema.ltcWalletPassphrase.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.zecWalletId.code,
    label: schema.zecWalletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.zecWalletPassphrase.code,
    label: schema.zecWalletPassphrase.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.bchWalletId.code,
    label: schema.bchWalletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.bchWalletPassphrase.code,
    label: schema.bchWalletPassphrase.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.dashWalletId.code,
    label: schema.dashWalletId.display,
    type: 'text',
    component: TextInputFormik
  },
  {
    name: schema.dashWalletPassphrase.code,
    label: schema.dashWalletPassphrase.display,
    type: 'text',
    component: SecretInputFormik
  },
  {
    name: schema.environment.code,
    label: schema.environment.display,
    placeholder: 'prod or test',
    type: 'text',
    component: TextInputFormik
  }
]

const BitgoForm = ({ account, handleSubmit, ...props }) => {
  const { code } = account

  const formik = getBitgoFormik(account)

  const fields = getBitgoFields()

  return (
    <>
      <EditService
        title="Bitgo"
        formik={formik}
        code={code}
        fields={fields}
        {...props}
      />
    </>
  )
}

export { BitgoForm, BitgoCard, getBitgoFormik, getBitgoFields }
