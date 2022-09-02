import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

const isDefined = it => it && it.length

const buildTestValidation = (id, passphrase) => {
  return Yup.string()
    .max(100, 'Too long')
    .when(id, {
      is: isDefined,
      then: Yup.string().test(secretTest(passphrase))
    })
}

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
      display: 'API Passphrase',
      component: SecretInputFormik
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
      passphrase: buildTestValidation('apiKey', account?.passphrase),
      walletId: Yup.string('The wallet id must be a string')
        .max(100, 'The wallet id is too long')
        .test(secretTest(account?.walletId))
    })
  }
}
