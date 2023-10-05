import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'galoy',
  name: 'Galoy',
  title: 'Galoy (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'walletId',
      display: 'Wallet ID',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(200, 'The API key is too long')
        .required('The API key is required'),
      walletId: Yup.string('The wallet id must be a string')
        .max(100, 'The wallet id is too long')
        .test(secretTest(account?.walletId))
    })
  }
}
