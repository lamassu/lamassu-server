import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'infura',
  name: 'Infura/Alchemy',
  title: 'Infura/Alchemy (Wallet)',
  elements: [
    {
      code: 'endpoint',
      display: 'Endpoint',
      component: TextInputFormik,
      face: true
    }
  ],
  getValidationSchema: () => {
    return Yup.object().shape({
      endpoint: Yup.string('The endpoint must be a string')
        .max(100, 'The endpoint is too long')
        .required('The endpoint is required')
    })
  }
}
