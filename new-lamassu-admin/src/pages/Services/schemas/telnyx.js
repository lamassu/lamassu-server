import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'telnyx',
  name: 'Telnyx',
  title: 'Telnyx (SMS)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: SecretInputFormik
    },
    {
      code: 'fromNumber',
      display: 'Telnyx Number (international format)',
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
        .test(secretTest(account?.apiKey, 'API key')),
      fromNumber: Yup.string('The Telnyx number must be a string')
        .max(100, 'The Telnyx number is too long')
        .required('The Telnyx number is required'),
      toNumber: Yup.string('The notifications number must be a string')
        .max(100, 'The notifications number is too long')
        .required('The notifications number is required')
    })
  }
}
