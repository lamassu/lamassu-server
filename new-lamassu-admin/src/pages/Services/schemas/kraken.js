import * as Yup from 'yup'

import SecretInputFormik from 'src/components/inputs/formik/SecretInput'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'kraken',
  name: 'Kraken',
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
  })
}
