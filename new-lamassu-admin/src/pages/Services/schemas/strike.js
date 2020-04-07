import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'strike',
  name: 'Strike',
  title: 'Strike (Lightning Payments)',
  elements: [
    {
      code: 'token',
      display: 'API Token',
      component: TextInputFormik,
      face: true,
      long: true
    }
  ],
  validationSchema: Yup.object().shape({
    token: Yup.string()
      .max(100, 'Too long')
      .required('Required')
  })
}
