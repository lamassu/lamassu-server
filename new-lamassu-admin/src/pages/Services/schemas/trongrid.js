import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'trongrid',
  name: 'Trongrid',
  title: 'Trongrid (Wallet)',
  elements: [
    {
      code: 'apiKey',
      display: 'Project ID',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'endpoint',
      display: 'Endpoint',
      component: TextInputFormik,
      face: true
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The project ID must be a string')
        .max(100, 'The project ID is too long')
        .required('The project ID is required'),
      endpoint: Yup.string('The endpoint must be a string')
        .max(100, 'The endpoint is too long')
        .required('The endpoint is required')
    })
  }
}
