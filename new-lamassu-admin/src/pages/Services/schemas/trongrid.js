import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'trongrid',
  name: 'Trongrid',
  title: 'Trongrid (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik,
      face: true,
      long: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The project ID must be a string')
        .max(100, 'The project ID is too long')
        .required('The project ID is required')
    })
  }
}
