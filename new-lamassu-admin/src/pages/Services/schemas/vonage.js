import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'vonage',
  name: 'Vonage',
  title: 'Vonage (SMS)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik
    },
    {
      code: 'apiSecret',
      display: 'API Secret',
      component: SecretInputFormik
    },
    {
      code: 'fromNumber',
      display: 'Vonage Number (international format)',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'toNumber',
      display: 'Notifications Number (international format)',
      component: TextInputFormik,
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(200, 'The API key is too long')
        .required('The Vonage number is required'),
      apiSecret: Yup.string('The API key must be a string')
        .max(200, 'The API secret is too long')
        .test(secretTest(account?.apiKey, 'API secret')),
      fromNumber: Yup.string('The Vonage number must be a string')
        .max(100, 'The Vonage number is too long')
        .required('The Vonage number is required'),
      toNumber: Yup.string('The notifications number must be a string')
        .max(100, 'The notifications number is too long')
        .required('The notifications number is required')
    })
  }
}
