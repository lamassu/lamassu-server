import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'blockcypher',
  name: 'Blockcypher',
  title: 'Blockcypher (Payments)',
  elements: [
    {
      code: 'token',
      display: 'API Token',
      component: TextInputFormik,
      face: true,
      long: true
    },
    {
      code: 'confidenceFactor',
      display: 'Confidence Factor',
      component: TextInputFormik,
      face: true
    }
  ],

  validationSchema: Yup.object().shape({
    token: Yup.string()
      .max(100, 'Too long')
      .required('Required'),
    confidenceFactor: Yup.number()
      .integer('Please input a positive integer')
      .positive('Please input a positive integer')
      .required('Required')
  })
}
