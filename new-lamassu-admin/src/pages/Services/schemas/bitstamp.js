import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

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

  validationSchema: Yup.object().shape({
    clientId: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    key: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    secret: Yup.string()
      .max(100, 'Too long')
      .required('Required')
  })
}
