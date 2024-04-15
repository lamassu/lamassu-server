import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { secretTest } from './helper'

export default {
  code: 'bitfinex',
  name: 'Bitfinex',
  title: 'Bitfinex (Exchange)',
  elements: [
    {
      code: 'key',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'secret',
      display: 'API Secret',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      key: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      secret: Yup.string('The API secret must be a string')
        .max(100, 'The API secret is too long')
        .test(secretTest(account?.secret, 'API secret'))
    })
  }
}
