import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'coinbasepro',
  name: 'Coinbase Pro',
  title: 'Coinbase Pro (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'passphrase',
      display: 'Passphrase',
      component: SecretInputFormik
    },
    {
      code: 'apiSecret',
      display: 'API Secret',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API Key must be a string')
        .max(200, 'The API Key is too long')
        .required('The API Key is required'),
      passphrase: Yup.string('The passphrase must be a string')
        .max(100, 'The passphrase is too long')
        .test(secretTest(account?.passphrase, 'Passphrase')),
      apiSecret: Yup.string('The API Secret must be a string')
        .max(100, 'The API Secret is too long')
        .test(secretTest(account?.apiSecret, 'API Secret'))
    })
  }
}
