import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'itbit',
  name: 'itBit',
  title: 'itBit (Exchange)',
  elements: [
    {
      code: 'userId',
      display: 'User ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'walletId',
      display: 'Wallet ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'clientKey',
      display: 'Client Key',
      component: TextInputFormik
    },
    {
      code: 'clientSecret',
      display: 'Client Secret',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      userId: Yup.string('The user ID must be a string')
        .max(100, 'The user ID is too long')
        .required('The user ID is required'),
      walletId: Yup.string('The wallet ID must be a string')
        .max(100, 'The wallet ID is too long')
        .required('The wallet ID is required'),
      clientKey: Yup.string('The client key must be a string')
        .max(100, 'The client key is too long')
        .required('The client key is required'),
      clientSecret: Yup.string('The client secret must be a string')
        .max(100, 'The client secret is too long')
        .test(secretTest(account?.clientSecret, 'client secret'))
    })
  }
}
