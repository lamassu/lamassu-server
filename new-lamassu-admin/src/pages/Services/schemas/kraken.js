import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'kraken',
  name: 'Kraken',
  hasSecret: true,
  title: 'Kraken (Exchange)',
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
  validationSchema: Yup.object().shape({
    apiKey: Yup.string()
      .max(100, 'Too long')
      .required(),
    privateKey: Yup.string()
      .max(100, 'Too long')
      .required()
  }),
  getValidationSchema: account => {
    const schema = {
      apiKey: Yup.string()
        .max(100, 'Too long')
        .required(),
      privateKey: Yup.string()
        .max(100, 'Too long')
        .test(secretTest(account?.privateKey))
    }
    return Yup.object().shape(schema)
  }
}
