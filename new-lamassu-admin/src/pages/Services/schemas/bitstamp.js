import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import secretTest from './helper'

export default {
  code: 'bitstamp',
  name: 'Bitstamp',
  title: 'Bitstamp (Exchange)',
  elements: [
    {
      code: 'clientId',
      display: 'Client ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
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
      clientId: Yup.string()
        .max(100, 'Too long')
        .required(),
      key: Yup.string()
        .max(100, 'Too long')
        .required(),
      secret: Yup.string()
        .max(100, 'Too long')
        .test(secretTest(account?.secret))
    })
  }
}
