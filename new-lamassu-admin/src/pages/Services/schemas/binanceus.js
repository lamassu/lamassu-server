import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'binanceus',
  name: 'Binance.us',
  title: 'Binance.us (Exchange)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'privateKey',
      display: 'Private Key',
      component: SecretInputFormik
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required(),
      privateKey: Yup.string()
        .max(100, 'Too long')
        .test(secretTest(account?.privateKey))
    })
  }
}
