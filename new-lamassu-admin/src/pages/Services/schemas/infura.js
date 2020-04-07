import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'infura',
  name: 'Infura',
  title: 'Infura (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'apiSecret',
      display: 'API Secret',
      component: SecretInputFormik
    },
    {
      code: 'endpoint',
      display: 'Endpoint',
      component: TextInputFormik,
      face: true
    }
  ],
  validationSchema: Yup.object().shape({
    apiKey: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    apiSecret: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    endpoint: Yup.string()
      .max(100, 'Too long')
      .required('Required')
  })
}
