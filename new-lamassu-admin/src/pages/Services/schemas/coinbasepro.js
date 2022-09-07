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
      apiKey: Yup.string('The API key must be a string')
        .max(200, 'The API key is too long')
        .required('The API key is required'),
      passphrase: secretTest(account?.passphrase, 'Passphrase'),
      apiSecret: secretTest(account?.apiSecret, 'API secret')
    })
  }
}
