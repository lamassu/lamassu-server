import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'infura',
  name: 'Infura',
  title: 'Infura (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'Project ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'apiSecret',
      display: 'Project Secret',
      component: SecretInputFormik
    },
    {
      code: 'endpoint',
      display: 'Endpoint',
      component: TextInputFormik,
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required(),
      apiSecret: Yup.string()
        .max(100, 'Too long')
        .test(secretTest(account?.apiSecret)),
      endpoint: Yup.string()
        .max(100, 'Too long')
        .required()
    })
  }
}
